// Login con GitHub (OAuth2). El navegador va a /api/auth/github, GitHub vuelve al callback con un `code`
// y el backend lo cambia por un token para leer el perfil. El secreto nunca sale del backend.
import { randomBytes } from 'node:crypto'
import { Router, type Response } from 'express'
import { iniciarSesion, usuarioPublico } from '../auth.js'
import { prisma } from '../db.js'

export const githubRouter = Router()

const STATE = 'oauth_state'
const config = () => ({ id: process.env.GITHUB_CLIENT_ID, secret: process.env.GITHUB_CLIENT_SECRET, app: process.env.APP_URL })
// Pasa por el dominio del frontend (rewrite /api/*), así la cookie de sesión queda en el dominio de la web
const callback = () => `${config().app}/api/auth/github/callback`

/** El frontend pregunta si el botón de GitHub tiene sentido (si no hay claves, no se enseña). */
githubRouter.get('/auth/config', (_req, res) => {
  const { id, secret, app } = config()
  res.json({ github: !!(id && secret && app) })
})

githubRouter.get('/auth/github', (_req, res) => {
  const { id, secret, app } = config()
  if (!id || !secret || !app) return res.redirect('/login?error=github')
  // `state` aleatorio en una cookie: el callback comprueba que la vuelta viene de un login que empezamos nosotros (CSRF)
  const state = randomBytes(16).toString('hex')
  res.cookie(STATE, state, { httpOnly: true, sameSite: 'lax', secure: !!process.env.VERCEL, maxAge: 10 * 60_000, path: '/api/auth/github' })
  const url = new URL('https://github.com/login/oauth/authorize')
  url.search = new URLSearchParams({ client_id: id, redirect_uri: callback(), scope: 'read:user user:email', state }).toString()
  res.redirect(url.toString())
})

type PerfilGithub = { id: number; login: string; name: string | null; avatar_url: string }

githubRouter.get('/auth/github/callback', async (req, res) => {
  const fallo = (res: Response, motivo: string) => {
    console.warn('Login con GitHub fallido:', motivo)
    res.redirect('/login?error=github')
  }
  const { code, state } = req.query
  const esperado = req.cookies?.[STATE]
  res.clearCookie(STATE, { path: '/api/auth/github' })
  if (!code || !state || state !== esperado) return fallo(res, 'state no coincide')

  const { id, secret } = config()
  const token = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: id, client_secret: secret, code, redirect_uri: callback() }),
  }).then((r) => r.json() as Promise<{ access_token?: string }>)
  if (!token.access_token) return fallo(res, 'sin access_token')

  const gh = (ruta: string) => fetch(`https://api.github.com${ruta}`, {
    headers: { Authorization: `Bearer ${token.access_token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'commit-dawhub' },
  }).then((r) => r.json())
  const [perfil, emails] = (await Promise.all([gh('/user'), gh('/user/emails')])) as [PerfilGithub, { email: string; primary: boolean; verified: boolean }[]]
  if (!perfil?.id) return fallo(res, 'sin perfil')
  // Solo el email principal y verificado sirve para enlazar con una cuenta que ya existe
  const email = Array.isArray(emails) ? emails.find((e) => e.primary && e.verified)?.email.toLowerCase() : undefined
  const githubId = String(perfil.id)
  const datosGithub = { githubId, githubUsername: perfil.login, avatarUrl: perfil.avatar_url }

  // 1) Ya ha entrado antes con GitHub · 2) tiene sesión y quiere conectar su GitHub · 3) mismo email verificado · 4) cuenta nueva
  let usuario = await prisma.usuario.findUnique({ where: { githubId }, select: { id: true } })
  if (!usuario && req.usuario) usuario = { id: req.usuario.id }
  if (!usuario && email) usuario = await prisma.usuario.findUnique({ where: { email }, select: { id: true } })
  if (usuario) {
    const otro = await prisma.usuario.findUnique({ where: { githubId } })
    if (otro && otro.id !== usuario.id) return fallo(res, 'ese GitHub ya está en otra cuenta')
    await prisma.usuario.update({ where: { id: usuario.id }, data: datosGithub })
  } else {
    if (!email) return fallo(res, 'GitHub sin email verificado')
    usuario = await prisma.usuario.create({ data: { nombre: perfil.name || perfil.login, email, ...datosGithub }, select: usuarioPublico })
  }
  iniciarSesion(res, usuario.id)
  res.redirect('/')
})
