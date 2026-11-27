import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import app from './app.js'
import { prisma } from './db.js'
import { media } from './routes/evaluaciones.js'
import { usuariosDeTest } from './test-helpers.js'

// Necesita la BD local en marcha. Todo lo que crean estos usuarios se borra al final.
const { conSesion, limpiar } = usuariosDeTest('test-bloque-c.dawhub')
beforeAll(limpiar)
afterAll(limpiar)

const dia = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString()

describe('evaluaciones y notas', () => {
  it('media ponderada solo con las notas puestas', () => {
    expect(media([{ nota: 10, peso: 3 }, { nota: 5, peso: 1 }, { nota: null, peso: 5 }])).toBe(8.75)
    expect(media([{ nota: null, peso: 1 }])).toBeNull()
  })

  it('el profesor pone notas en su asignatura y cada alumno ve solo las suyas', async () => {
    const profe = await conSesion('profesor')
    const otroProfe = await conSesion('profesor')
    const ana = await conSesion('alumno')
    const beto = await conSesion('alumno')
    const a = await prisma.asignatura.create({ data: { nombre: 'Notas de test', curso: '2º DAW', profesorId: profe.u.id } })

    await ana.agent.post(`/api/asignaturas/${a.id}/evaluaciones`).send({ titulo: 'X', tipo: 'examen', fecha: dia(1) }).expect(403)
    const ev = await profe.agent.post(`/api/asignaturas/${a.id}/evaluaciones`).send({ titulo: 'Examen T1', tipo: 'examen', fecha: dia(1), peso: 2 }).expect(201)
    const e = ev.body.id

    await otroProfe.agent.put(`/api/evaluaciones/${e}/notas/${ana.u.id}`).send({ nota: 10 }).expect(403)
    await profe.agent.put(`/api/evaluaciones/${e}/notas/${ana.u.id}`).send({ nota: 11 }).expect(400)
    await profe.agent.put(`/api/evaluaciones/${e}/notas/${profe.u.id}`).send({ nota: 5 }).expect(404) // un profesor no es alumno
    await profe.agent.put(`/api/evaluaciones/${e}/notas/${ana.u.id}`).send({ nota: 7.5, comentario: 'Bien' }).expect(200)
    await profe.agent.put(`/api/evaluaciones/${e}/notas/${beto.u.id}`).send({ nota: 4 }).expect(200)

    const deAna = (await ana.agent.get('/api/notas').expect(200)).body.find((x: any) => x.id === a.id)
    expect(deAna.evaluaciones[0]).toMatchObject({ titulo: 'Examen T1', nota: 7.5, comentario: 'Bien' })
    expect(deAna.media).toBe(7.5)
    expect(JSON.stringify(deAna)).not.toContain('"nota":4') // la de Beto no le llega

    await profe.agent.get('/api/notas').expect(403) // /notas es la vista del alumno
    const cuaderno = await profe.agent.get(`/api/asignaturas/${a.id}/notas`).expect(200)
    expect(cuaderno.body.notas).toHaveLength(2)
    await otroProfe.agent.get(`/api/asignaturas/${a.id}/notas`).expect(403)

    await profe.agent.put(`/api/evaluaciones/${e}/notas/${beto.u.id}`).send({ nota: '' }).expect(204) // quitar nota
    expect((await profe.agent.get(`/api/asignaturas/${a.id}/notas`)).body.notas).toHaveLength(1)
  })
})

describe('retos', () => {
  async function retoAbierto(profe: Awaited<ReturnType<typeof conSesion>>) {
    const r = await profe.agent.post('/api/retos').send({ titulo: 'Hackathon test', descripcionMd: 'Haz algo', inicio: dia(-1), fin: dia(1), maxMiembros: 2 }).expect(201)
    return r.body.id as number
  }

  it('solo profesores y admins crean retos, con fechas coherentes', async () => {
    await (await conSesion('alumno')).agent.post('/api/retos').send({ titulo: 'X', descripcionMd: 'Y', inicio: dia(0), fin: dia(1) }).expect(403)
    const profe = await conSesion('profesor')
    await profe.agent.post('/api/retos').send({ titulo: 'X', descripcionMd: 'Y', inicio: dia(2), fin: dia(1) }).expect(400)
  })

  it('equipos: un alumno, un equipo por reto; equipos con límite; profesores no participan', async () => {
    const profe = await conSesion('profesor')
    const id = await retoAbierto(profe)
    const [a, b, c] = [await conSesion('alumno'), await conSesion('alumno'), await conSesion('alumno')]

    await profe.agent.post(`/api/retos/${id}/equipos`).send({ nombre: 'Profes' }).expect(403)
    const eq = (await a.agent.post(`/api/retos/${id}/equipos`).send({ nombre: 'Los Test' }).expect(201)).body.id
    await a.agent.post(`/api/retos/${id}/equipos`).send({ nombre: 'Otro' }).expect(409) // ya tiene equipo
    await b.agent.post(`/api/retos/${id}/equipos`).send({ nombre: 'Los Test' }).expect(409) // nombre repetido
    await b.agent.post(`/api/equipos/${eq}/unirse`).expect(204)
    await c.agent.post(`/api/equipos/${eq}/unirse`).expect(400) // completo (máx. 2)

    // Al salir el último, el equipo desaparece
    await a.agent.post(`/api/equipos/${eq}/salir`).expect(204)
    await b.agent.post(`/api/equipos/${eq}/salir`).expect(204)
    expect(await prisma.equipo.findUnique({ where: { id: eq } })).toBeNull()
  })

  it('entrega y voto: solo a equipos entregados y nunca al tuyo; los votos se ocultan hasta el cierre', async () => {
    const profe = await conSesion('profesor')
    const id = await retoAbierto(profe)
    const [a, b] = [await conSesion('alumno'), await conSesion('alumno')]
    const eqA = (await a.agent.post(`/api/retos/${id}/equipos`).send({ nombre: 'A' })).body.id
    const eqB = (await b.agent.post(`/api/retos/${id}/equipos`).send({ nombre: 'B' })).body.id

    await b.agent.patch(`/api/equipos/${eqA}/entrega`).send({ repoUrl: 'https://github.com/x/y' }).expect(403) // no es su equipo
    await a.agent.patch(`/api/equipos/${eqA}/entrega`).send({ repoUrl: 'javascript:alert(1)' }).expect(400)
    await a.agent.patch(`/api/equipos/${eqA}/entrega`).send({ repoUrl: 'https://github.com/x/y', demoUrl: 'https://x.vercel.app' }).expect(200)

    await b.agent.put(`/api/retos/${id}/voto`).send({ equipoId: eqB }).expect(400) // el suyo (y sin entregar)
    await a.agent.put(`/api/retos/${id}/voto`).send({ equipoId: eqA }).expect(400) // el suyo
    await b.agent.put(`/api/retos/${id}/voto`).send({ equipoId: eqA }).expect(204)
    await b.agent.put(`/api/retos/${id}/voto`).send({ equipoId: eqA }).expect(204) // cambiar/repetir no duplica
    expect(await prisma.voto.count({ where: { retoId: id } })).toBe(1)

    const comoAlumno = await a.agent.get(`/api/retos/${id}`).expect(200)
    expect(comoAlumno.body.equipos[0].votos).toBeNull()
    expect(comoAlumno.body.miEquipoId).toBe(eqA)
    const comoProfe = await profe.agent.get(`/api/retos/${id}`).expect(200)
    expect(comoProfe.body.equipos.find((e: any) => e.id === eqA).votos).toBe(1)
  })
})

describe('propuestas y ofertas', () => {
  it('cualquiera propone y se apunta; solo un profesor aprueba', async () => {
    const alumno = await conSesion('alumno')
    const otro = await conSesion('alumno')
    const profe = await conSesion('profesor')
    const p = await alumno.agent.post('/api/propuestas').send({ titulo: 'Bot', descripcionMd: 'Un bot', tecnologias: 'Node, discord.js, Node' }).expect(201)
    expect(p.body.tecnologias).toEqual(['Node', 'discord.js'])

    await otro.agent.put(`/api/propuestas/${p.body.id}/interes`).expect(204)
    await otro.agent.put(`/api/propuestas/${p.body.id}/interes`).expect(204) // idempotente
    const lista = (await otro.agent.get('/api/propuestas')).body.find((x: any) => x.id === p.body.id)
    expect(lista).toMatchObject({ meInteresa: true, _count: { interesados: 1 } })

    await otro.agent.patch(`/api/propuestas/${p.body.id}`).send({ estado: 'aprobada' }).expect(403)
    await profe.agent.patch(`/api/propuestas/${p.body.id}`).send({ estado: 'aprobada' }).expect(200)
    await otro.agent.delete(`/api/propuestas/${p.body.id}`).expect(403)
    await alumno.agent.delete(`/api/propuestas/${p.body.id}`).expect(204)
  })

  it('la oferta de un alumno queda pendiente y solo la ven él y los profesores hasta aprobarla', async () => {
    const alumno = await conSesion('alumno')
    const otro = await conSesion('alumno')
    const profe = await conSesion('profesor')
    const o = await alumno.agent.post('/api/ofertas').send({ titulo: 'Junior', empresa: 'Acme', url: 'https://acme.dev/job', tipo: 'empleo' }).expect(201)
    expect(o.body.aprobada).toBe(false)

    const ids = async (ag: request.Agent) => (await ag.get('/api/ofertas')).body.map((x: any) => x.id)
    expect(await ids(alumno.agent)).toContain(o.body.id)
    expect(await ids(otro.agent)).not.toContain(o.body.id)
    expect(await ids(profe.agent)).toContain(o.body.id)

    await otro.agent.patch(`/api/ofertas/${o.body.id}/aprobar`).expect(403)
    await profe.agent.patch(`/api/ofertas/${o.body.id}/aprobar`).expect(200)
    expect(await ids(otro.agent)).toContain(o.body.id)
    expect((await profe.agent.post('/api/ofertas').send({ titulo: 'P', empresa: 'E', url: 'https://e.dev', tipo: 'practicas' })).body.aprobada).toBe(true)
  })
})
