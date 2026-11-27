import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import app from './app.js'
import { prisma } from './db.js'
import { usuariosDeTest } from './test-helpers.js'

const DOMINIO = 'test-github.dawhub'
const { conSesion, limpiar } = usuariosDeTest(DOMINIO)
beforeAll(async () => {
  process.env.GITHUB_CLIENT_ID = 'cliente-test'
  process.env.GITHUB_CLIENT_SECRET = 'secreto-test'
  process.env.APP_URL = 'http://localhost:5173'
  await limpiar()
})
afterAll(limpiar)

/** GitHub falso: devuelve este perfil y este email al cambiar el code por el token. */
function githubDevuelve(perfil: { id: number; login: string; name?: string }, email: string, verificado = true) {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
    const u = String(url)
    const json = u.includes('access_token') ? { access_token: 'tok' }
      : u.endsWith('/user') ? { avatar_url: `https://avatars.test/${perfil.login}`, name: null, ...perfil }
      : [{ email, primary: true, verified: verificado }]
    return new Response(JSON.stringify(json))
  })
}
beforeEach(() => vi.restoreAllMocks())

/** Empieza el login (cookie de state) y vuelve de GitHub con ese state. Devuelve la respuesta del callback. */
async function loginConGithub(agent = request.agent(app), state?: string) {
  const ida = await agent.get('/api/auth/github').expect(302)
  const destino = new URL(ida.headers.location)
  expect(destino.origin).toBe('https://github.com')
  expect(destino.searchParams.get('redirect_uri')).toBe('http://localhost:5173/api/auth/github/callback')
  const vuelta = await agent.get(`/api/auth/github/callback?code=abc&state=${state ?? destino.searchParams.get('state')}`)
  return { agent, vuelta }
}

const id = () => Math.floor(Math.random() * 1e9)

describe('login con GitHub', () => {
  it('rechaza una vuelta con un state que no es el nuestro (CSRF)', async () => {
    githubDevuelve({ id: id(), login: 'x' }, `x@${DOMINIO}`)
    const { vuelta } = await loginConGithub(undefined, 'state-falso')
    expect(vuelta.headers.location).toBe('/login?error=github')
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('crea una cuenta de alumno con los datos de GitHub y entra', async () => {
    const gid = id()
    githubDevuelve({ id: gid, login: 'nueva-gh', name: 'Nueva GitHub' }, `nueva@${DOMINIO}`)
    const { agent, vuelta } = await loginConGithub()
    expect(vuelta.headers.location).toBe('/')
    const me = (await agent.get('/api/me').expect(200)).body
    expect(me).toMatchObject({ nombre: 'Nueva GitHub', email: `nueva@${DOMINIO}`, rol: 'alumno', githubId: String(gid), githubUsername: 'nueva-gh', avatarUrl: 'https://avatars.test/nueva-gh' })
    // Sin contraseña: solo puede entrar con GitHub
    expect((await prisma.usuario.findUnique({ where: { id: me.id } }))!.passwordHash).toBeNull()

    // La segunda vez entra en la misma cuenta
    const otra = await loginConGithub()
    expect((await otra.agent.get('/api/me')).body.id).toBe(me.id)
  })

  it('enlaza con una cuenta existente solo si el email de GitHub está verificado', async () => {
    const { u } = await conSesion('alumno')
    githubDevuelve({ id: id(), login: 'sin-verificar' }, u.email, false)
    expect((await loginConGithub()).vuelta.headers.location).toBe('/login?error=github')

    githubDevuelve({ id: id(), login: 'verificado' }, u.email, true)
    const { agent } = await loginConGithub()
    expect((await agent.get('/api/me')).body).toMatchObject({ id: u.id, githubUsername: 'verificado' })
  })

  it('con sesión iniciada, conecta GitHub a tu cuenta aunque el email sea otro', async () => {
    const { agent, u } = await conSesion('profesor')
    githubDevuelve({ id: id(), login: 'profe-gh' }, `otro-email@${DOMINIO}`)
    await loginConGithub(agent)
    expect((await agent.get('/api/me')).body).toMatchObject({ id: u.id, rol: 'profesor', githubUsername: 'profe-gh' })
  })

  it('sin claves configuradas no hay botón ni login', async () => {
    const guardado = process.env.GITHUB_CLIENT_ID
    delete process.env.GITHUB_CLIENT_ID
    expect((await request(app).get('/api/auth/config')).body).toEqual({ github: false })
    expect((await request(app).get('/api/auth/github')).headers.location).toBe('/login?error=github')
    process.env.GITHUB_CLIENT_ID = guardado
  })
})
