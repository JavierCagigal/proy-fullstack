import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import app from './app.js'
import { prisma } from './db.js'
import { borrarArchivo } from './storage.js'
import { usuariosDeTest } from './test-helpers.js'

// Supabase Storage no se toca en los tests: devolvemos URLs falsas
vi.mock('./storage.js', () => ({
  urlDeSubida: vi.fn(async (path: string) => `https://storage.test/subir/${path}`),
  urlDeDescarga: vi.fn(async (path: string) => `https://storage.test/bajar/${path}`),
  borrarArchivo: vi.fn(async () => {}),
}))

const { conSesion, limpiar } = usuariosDeTest('test-recursos.dawhub')
beforeAll(limpiar)
afterAll(limpiar)

const dia = (n: number) => new Date(Date.now() + n * 86_400_000)

/** Asignatura de un profesor con un tema y un recurso en cada estado de visibilidad. */
async function asignaturaConRecursos() {
  const profe = await conSesion('profesor')
  const a = await prisma.asignatura.create({ data: { nombre: 'Asignatura de test', curso: '2º DAW', profesorId: profe.u.id } })
  const tema = await prisma.tema.create({ data: { asignaturaId: a.id, titulo: 'Tema 1' } })
  const recurso = (titulo: string, visible: boolean, visibleDesde: Date | null = null) =>
    prisma.recurso.create({ data: { temaId: tema.id, tipo: 'apunte', titulo, visible, visibleDesde, autorId: profe.u.id } })
  const visible = await recurso('visible', true)
  const oculto = await recurso('oculto', false)
  await recurso('programado', true, dia(3))
  await recurso('ya publicado', true, dia(-1))
  return { profe, a, tema, visible, oculto }
}

const titulos = (res: request.Response) => res.body.temas[0].recursos.map((r: { titulo: string }) => r.titulo).sort()

describe('visibilidad', () => {
  it('el alumno y otros profesores solo ven lo publicado; el profesor y el admin lo ven todo', async () => {
    const { profe, a } = await asignaturaConRecursos()
    const alumno = await conSesion('alumno')
    const otroProfe = await conSesion('profesor')
    const admin = await conSesion('admin')

    const comoAlumno = await alumno.agent.get(`/api/asignaturas/${a.id}`).expect(200)
    expect(titulos(comoAlumno)).toEqual(['visible', 'ya publicado'])
    expect(comoAlumno.body.editable).toBe(false)

    expect(titulos(await otroProfe.agent.get(`/api/asignaturas/${a.id}`))).toEqual(['visible', 'ya publicado'])

    const comoProfe = await profe.agent.get(`/api/asignaturas/${a.id}`)
    expect(titulos(comoProfe)).toEqual(['oculto', 'programado', 'visible', 'ya publicado'])
    expect(comoProfe.body.editable).toBe(true)
    expect(titulos(await admin.agent.get(`/api/asignaturas/${a.id}`))).toHaveLength(4)
  })

  it('el panel solo muestra recursos publicados', async () => {
    const { profe } = await asignaturaConRecursos()
    const res = await profe.agent.get('/api/panel').expect(200)
    const mios = res.body.recientes.filter((r: any) => r.tema.asignatura.nombre === 'Asignatura de test').map((r: any) => r.titulo)
    expect(mios).not.toContain('oculto')
    expect(mios).not.toContain('programado')
  })

  it('sin sesión no se ve nada', async () => {
    await request(app).get('/api/asignaturas').expect(401)
    await request(app).get('/api/panel').expect(401)
  })
})

describe('permisos de edición', () => {
  it('un alumno no crea asignaturas; un profesor sí, y quedan a su nombre', async () => {
    await (await conSesion('alumno')).agent.post('/api/asignaturas').send({ nombre: 'X', curso: '1º' }).expect(403)
    const profe = await conSesion('profesor')
    const res = await profe.agent.post('/api/asignaturas').send({ nombre: 'Nueva', curso: '1º DAW', profesorId: 1 }).expect(201)
    expect(res.body.profesorId).toBe(profe.u.id)
  })

  it('solo el profesor de la asignatura edita sus temas y recursos', async () => {
    const { profe, a, tema, oculto } = await asignaturaConRecursos()
    const otro = await conSesion('profesor')

    await otro.agent.post(`/api/asignaturas/${a.id}/temas`).send({ titulo: 'Intruso' }).expect(403)
    await otro.agent.patch(`/api/recursos/${oculto.id}`).send({ visible: true }).expect(403)
    await otro.agent.delete(`/api/temas/${tema.id}`).expect(403)

    const t2 = await profe.agent.post(`/api/asignaturas/${a.id}/temas`).send({ titulo: 'Tema 2' }).expect(201)
    expect(t2.body.orden).toBe(tema.orden + 1)
    const r = await profe.agent.patch(`/api/recursos/${oculto.id}`).send({ visible: true, visibleDesde: null }).expect(200)
    expect(r.body.visible).toBe(true)
    await profe.agent.patch('/api/recursos/999999999').send({ visible: true }).expect(404)
  })

  it('valida los recursos: tipo, URL y enlaces peligrosos', async () => {
    const { profe, tema } = await asignaturaConRecursos()
    const crear = (body: object) => profe.agent.post(`/api/temas/${tema.id}/recursos`).send(body)

    await crear({ tipo: 'skill', titulo: 'X' }).expect(400)
    await crear({ tipo: 'video', titulo: 'Sin URL' }).expect(400)
    await crear({ tipo: 'enlace', titulo: 'XSS', url: 'javascript:alert(1)' }).expect(400)
    const ok = await crear({ tipo: 'enlace', titulo: 'MDN', url: 'https://developer.mozilla.org', visible: true }).expect(201)
    expect(ok.body).toMatchObject({ tipo: 'enlace', visible: true })
  })
})

describe('archivos', () => {
  it('valida tipo y tamaño, y devuelve una URL de subida firmada', async () => {
    const { profe, visible } = await asignaturaConRecursos()
    const subir = (body: object) => profe.agent.post(`/api/recursos/${visible.id}/archivo`).send(body)

    await subir({ nombre: 'virus.exe', bytes: 100 }).expect(400)
    await subir({ nombre: 'apuntes.pdf', bytes: 21 * 1024 * 1024 }).expect(400)
    const res = await subir({ nombre: 'Tema 1 (versión final).pdf', bytes: 1000 }).expect(200)
    expect(res.body.uploadUrl).toMatch(/^https:\/\/storage\.test\/subir\/\d+\/[\w-]+-Tema_1__version_final_\.pdf$/)

    const r = await prisma.recurso.findUniqueOrThrow({ where: { id: visible.id } })
    expect(r).toMatchObject({ archivoNombre: 'Tema 1 (versión final).pdf', archivoBytes: 1000 })
  })

  it('la descarga respeta la visibilidad: el alumno no puede bajar un archivo oculto', async () => {
    const { profe, visible, oculto } = await asignaturaConRecursos()
    for (const r of [visible, oculto]) await profe.agent.post(`/api/recursos/${r.id}/archivo`).send({ nombre: 'a.pdf', bytes: 10 }).expect(200)
    const alumno = await conSesion('alumno')

    const ok = await alumno.agent.get(`/api/recursos/${visible.id}/archivo`).expect(302)
    expect(ok.headers.location).toMatch(/^https:\/\/storage\.test\/bajar\//)
    await alumno.agent.get(`/api/recursos/${oculto.id}/archivo`).expect(404)
    await profe.agent.get(`/api/recursos/${oculto.id}/archivo`).expect(302)
  })

  it('borrar un recurso borra también su archivo de Storage', async () => {
    const { profe, visible } = await asignaturaConRecursos()
    await profe.agent.post(`/api/recursos/${visible.id}/archivo`).send({ nombre: 'a.zip', bytes: 10 }).expect(200)
    const { archivoPath } = await prisma.recurso.findUniqueOrThrow({ where: { id: visible.id } })
    await profe.agent.delete(`/api/recursos/${visible.id}`).expect(204)
    expect(borrarArchivo).toHaveBeenCalledWith(archivoPath)
  })
})
