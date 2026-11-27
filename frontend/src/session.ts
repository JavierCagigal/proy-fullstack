import { api } from './api'

export type Rol = 'admin' | 'profesor' | 'alumno'
export type Usuario = {
  id: number; nombre: string; email: string; rol: Rol
  githubId: string | null; githubUsername: string | null; avatarUrl: string | null; bio: string | null
}

// Usuario con sesión iniciada (null si no hay). La sesión real es la cookie httpOnly; esto es solo para pintar la interfaz.
let actual: Usuario | null = null

export const usuario = () => actual

/** Cambia el usuario y avisa a quien pinte cosas según la sesión (la cabecera). */
export function setUsuario(u: Usuario | null) {
  actual = u
  document.dispatchEvent(new Event('sesion'))
}

export const cargarSesion = () => api<Usuario>('/me').then(setUsuario, () => setUsuario(null))
