// Sesión con JWT en cookie httpOnly y control de roles (docs/PLAN.md §2).
import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from './db.js'
import type { Rol } from './generated/prisma/enums.js'

/** Campos de un usuario que se pueden enviar al frontend (nunca el hash). */
export const usuarioPublico = {
  id: true, nombre: true, email: true, rol: true, githubId: true, githubUsername: true, avatarUrl: true, bio: true,
} as const

export type UsuarioSesion = { id: number; nombre: string; email: string; rol: Rol; githubId: string | null; githubUsername: string | null; avatarUrl: string | null; bio: string | null }

declare global {
  namespace Express {
    interface Request { usuario?: UsuarioSesion }
  }
}

const COOKIE = 'token'
const cookieOptions = { httpOnly: true, sameSite: 'lax', secure: !!process.env.VERCEL, path: '/' } as const

function secret() {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('Falta JWT_SECRET (ver backend/.env.example)')
  return s
}

export function iniciarSesion(res: Response, usuarioId: number) {
  const token = jwt.sign({ sub: String(usuarioId) }, secret(), { expiresIn: '7d' })
  res.cookie(COOKIE, token, { ...cookieOptions, maxAge: 7 * 24 * 3600 * 1000 })
}

export const cerrarSesion = (res: Response) => res.clearCookie(COOKIE, cookieOptions)

/**
 * Pone en req.usuario al usuario de la cookie, si es válida.
 * El token solo lleva el id: el rol se lee de la BD en cada petición, así un cambio de rol se aplica al momento.
 */
export async function cargarUsuario(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE]
  if (token) {
    let id: number | undefined
    try {
      id = Number((jwt.verify(token, secret()) as jwt.JwtPayload).sub)
    } catch {
      // token caducado o manipulado: se trata como si no hubiera sesión
    }
    if (id) req.usuario = (await prisma.usuario.findUnique({ where: { id }, select: usuarioPublico })) ?? undefined
  }
  next()
}

/** 401 sin sesión, 403 si el rol no está permitido. Sin argumentos = cualquier usuario con sesión. */
export const requireRol = (...roles: Rol[]) => (req: Request, res: Response, next: NextFunction) => {
  if (!req.usuario) return void res.status(401).json({ error: 'Inicia sesión' })
  if (roles.length && !roles.includes(req.usuario.rol)) return void res.status(403).json({ error: 'No tienes permiso' })
  next()
}
