// Utilidades para los tests de la API: crean usuarios propios del test y los borran al acabar.
import { hash } from 'bcryptjs'
import request from 'supertest'
import app from './app.js'
import { prisma } from './db.js'

export const PASSWORD = 'secreta123'

/** Un dominio de email por archivo de test, para poder borrar solo lo suyo. */
export function usuariosDeTest(dominio: string) {
  let i = 0
  const email = (n: string) => `${n}-${Date.now()}-${i++}@${dominio}`

  /** Crea un usuario con ese rol y devuelve un agente de Supertest con su sesión iniciada. */
  async function conSesion(rol: 'admin' | 'profesor' | 'alumno') {
    const u = await prisma.usuario.create({ data: { nombre: rol, email: email(rol), rol, passwordHash: await hash(PASSWORD, 4) } })
    const agent = request.agent(app)
    await agent.post('/api/auth/login').send({ email: u.email, password: PASSWORD }).expect(200)
    return { agent, u }
  }

  /** Borra lo creado por los usuarios de este dominio (sus asignaturas arrastran temas y recursos). */
  async function limpiar() {
    const suyos = { endsWith: `@${dominio}` }
    await prisma.reto.deleteMany({ where: { creadoPor: { email: suyos } } })
    await prisma.oferta.deleteMany({ where: { autor: { email: suyos } } })
    await prisma.asignatura.deleteMany({ where: { profesor: { email: suyos } } })
    await prisma.recurso.deleteMany({ where: { autor: { email: suyos } } })
    await prisma.usuario.deleteMany({ where: { email: suyos } })
  }

  return { email, conSesion, limpiar }
}
