import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { prisma } from './db.js'
import { usuariosDeTest } from './test-helpers.js'

const { conSesion, limpiar } = usuariosDeTest('test-clase.dawhub')
beforeAll(limpiar)
afterAll(limpiar)

describe('la clase', () => {
  it('cada uno edita su perfil, con un usuario de GitHub válido', async () => {
    const { agent, u } = await conSesion('alumno')
    await agent.patch('/api/me').send({ nombre: 'Test', githubUsername: 'no vale', bio: '' }).expect(400)
    await agent.patch('/api/me').send({ nombre: 'Test', githubUsername: 'x'.repeat(40) }).expect(400)
    await agent.patch('/api/me').send({ nombre: 'Test', bio: 'x'.repeat(281) }).expect(400)
    const res = await agent.patch('/api/me').send({ nombre: 'Lucía Test', githubUsername: '@lucia-test', bio: 'Me gusta el backend', rol: 'admin' }).expect(200)
    expect(res.body).toMatchObject({ nombre: 'Lucía Test', githubUsername: 'lucia-test', bio: 'Me gusta el backend', rol: 'alumno' })

    const perfil = await agent.get(`/api/clase/${u.id}`).expect(200)
    expect(perfil.body.email).toBeUndefined()
    expect(perfil.body.githubUsername).toBe('lucia-test')
  })

  it('la lista no enseña emails ni admins, y suma retos y tecnologías de cada persona', async () => {
    const { agent, u } = await conSesion('alumno')
    const { u: admin } = await conSesion('admin')
    await prisma.propuesta.create({ data: { titulo: 'X', descripcionMd: 'Y', tecnologias: ['Rust', 'Wasm'], autorId: u.id } })

    const clase = (await agent.get('/api/clase').expect(200)).body
    expect(clase.some((p: any) => p.id === admin.id)).toBe(false)
    expect(JSON.stringify(clase)).not.toContain('@test-clase')
    expect(clase.find((p: any) => p.id === u.id).tecnologias).toEqual(['Rust', 'Wasm'])
    await agent.get(`/api/clase/${admin.id}`).expect(404)
  })
})

describe('skills', () => {
  it('la skill de un alumno queda pendiente hasta que la aprueba un profesor', async () => {
    const alumno = await conSesion('alumno')
    const otro = await conSesion('alumno')
    const profe = await conSesion('profesor')
    await alumno.agent.post('/api/skills').send({ titulo: 'X', url: 'https://x.dev', categoria: 'cocina' }).expect(400)
    const s = await alumno.agent.post('/api/skills').send({ titulo: 'Roadmap backend', url: 'https://roadmap.sh/backend', categoria: 'Backend' }).expect(201)
    expect(s.body).toMatchObject({ visible: false, categoria: 'backend' })

    const ids = async (ag: typeof otro.agent) => (await ag.get('/api/skills')).body.map((x: any) => x.id)
    expect(await ids(alumno.agent)).toContain(s.body.id)
    expect(await ids(otro.agent)).not.toContain(s.body.id)
    expect(await ids(profe.agent)).toContain(s.body.id)

    await otro.agent.patch(`/api/skills/${s.body.id}/aprobar`).expect(403)
    await profe.agent.patch(`/api/skills/${s.body.id}/aprobar`).expect(200)
    expect(await ids(otro.agent)).toContain(s.body.id)
    await otro.agent.delete(`/api/skills/${s.body.id}`).expect(403)
    await alumno.agent.delete(`/api/skills/${s.body.id}`).expect(204)
  })

  it('las rutas de skills no tocan recursos de un tema', async () => {
    const profe = await conSesion('profesor')
    const a = await prisma.asignatura.create({ data: { nombre: 'A', curso: '1º', profesorId: profe.u.id } })
    const t = await prisma.tema.create({ data: { asignaturaId: a.id, titulo: 'T' } })
    const r = await prisma.recurso.create({ data: { temaId: t.id, tipo: 'apunte', titulo: 'Apunte', autorId: profe.u.id } })
    await profe.agent.delete(`/api/skills/${r.id}`).expect(404)
    await profe.agent.patch(`/api/skills/${r.id}/aprobar`).expect(404)
  })
})
