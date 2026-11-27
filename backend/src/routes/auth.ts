import { compare, hash } from 'bcryptjs'
import { Router } from 'express'
import { cerrarSesion, iniciarSesion, requireRol, usuarioPublico } from '../auth.js'
import { prisma } from '../db.js'

export const authRouter = Router()

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Cualquiera puede registrarse y entra como alumno (el rol no se acepta del cliente).
authRouter.post('/auth/registro', async (req, res) => {
  const nombre = String(req.body?.nombre ?? '').trim()
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const password = String(req.body?.password ?? '')
  // bcrypt solo usa los primeros 72 bytes
  if (!nombre || !EMAIL.test(email) || password.length < 8 || password.length > 72) {
    return void res.status(400).json({ error: 'Pon tu nombre, un email válido y una contraseña de 8 a 72 caracteres' })
  }
  if (await prisma.usuario.findUnique({ where: { email } })) {
    return void res.status(409).json({ error: 'Ese email ya está registrado' })
  }
  const usuario = await prisma.usuario.create({
    data: { nombre, email, passwordHash: await hash(password, 10) },
    select: usuarioPublico,
  })
  iniciarSesion(res, usuario.id)
  res.status(201).json(usuario)
})

authRouter.post('/auth/login', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const u = await prisma.usuario.findUnique({ where: { email }, select: { ...usuarioPublico, passwordHash: true } })
  // Mismo mensaje si no existe o si la contraseña falla, para no revelar qué emails hay
  if (!u?.passwordHash || !(await compare(String(req.body?.password ?? ''), u.passwordHash))) {
    return void res.status(401).json({ error: 'Email o contraseña incorrectos' })
  }
  const { passwordHash: _, ...usuario } = u
  iniciarSesion(res, usuario.id)
  res.json(usuario)
})

authRouter.post('/auth/logout', (_req, res) => {
  cerrarSesion(res)
  res.status(204).end()
})

authRouter.get('/me', requireRol(), (req, res) => {
  res.json(req.usuario)
})
