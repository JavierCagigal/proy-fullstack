// Bloque C: evaluaciones (calendario) y notas (docs/PLAN.md §2).
// El alumno solo ve sus notas; el profesor, las de sus asignaturas; el admin, todas.
import { Router, type Request, type Response } from 'express'
import { requireRol } from '../auth.js'
import { prisma } from '../db.js'
import { TipoEvaluacion } from '../generated/prisma/enums.js'
import { fecha, idDe, texto } from '../validar.js'
import { puedeEditar } from './asignaturas.js'

export const evaluacionesRouter = Router()
evaluacionesRouter.use(['/evaluaciones', '/notas'], requireRol())

const evaluacionPublica = { id: true, titulo: true, tipo: true, fecha: true, peso: true, asignatura: { select: { id: true, nombre: true } } } as const

/** Media ponderada de las notas puestas (null si aún no hay ninguna). */
export function media(items: { nota: number | null; peso: number }[]) {
  const puestas = items.filter((i) => i.nota !== null)
  const pesos = puestas.reduce((s, i) => s + i.peso, 0)
  return pesos ? Math.round((puestas.reduce((s, i) => s + i.nota! * i.peso, 0) / pesos) * 100) / 100 : null
}

function datosEvaluacion(body: any, crear: boolean) {
  const data: { titulo?: string; tipo?: TipoEvaluacion; fecha?: Date; peso?: number } = {}
  if (crear || body?.titulo !== undefined) {
    if (!texto(body?.titulo)) return 'Pon un título'
    data.titulo = texto(body.titulo)
  }
  if (crear || body?.tipo !== undefined) {
    if (!Object.values(TipoEvaluacion).includes(body?.tipo)) return 'Tipo no válido'
    data.tipo = body.tipo
  }
  if (crear || body?.fecha !== undefined) {
    const f = fecha(body?.fecha)
    if (!f) return 'Pon una fecha válida'
    data.fecha = f
  }
  if (body?.peso !== undefined && body.peso !== '') {
    const peso = Number(body.peso)
    if (!(peso > 0 && peso <= 100)) return 'El peso tiene que estar entre 0 y 100'
    data.peso = peso
  }
  return data
}

/** La asignatura de la URL, si el usuario puede editarla (si no, responde 404/403 y devuelve null). */
async function asignaturaEditable(req: Request, res: Response, id: number) {
  const a = await prisma.asignatura.findUnique({ where: { id } })
  return comprobar(res, a, a && puedeEditar(req.usuario!, a.profesorId), 'Esa asignatura no existe')
}
async function evaluacionEditable(req: Request, res: Response) {
  const e = await prisma.evaluacion.findUnique({ where: { id: idDe(req.params.id) }, include: { asignatura: true } })
  return comprobar(res, e, e && puedeEditar(req.usuario!, e.asignatura.profesorId), 'Esa evaluación no existe')
}
function comprobar<T>(res: Response, item: T | null, permitido: boolean | null, noExiste: string) {
  if (!item) {
    res.status(404).json({ error: noExiste })
    return null
  }
  if (!permitido) {
    res.status(403).json({ error: 'Solo el profesor de la asignatura puede hacer esto' })
    return null
  }
  return item
}

// ── Calendario ─────────────────────────────────────────────────────────────

evaluacionesRouter.get('/evaluaciones', async (_req, res) => {
  res.json(await prisma.evaluacion.findMany({ orderBy: { fecha: 'asc' }, select: evaluacionPublica }))
})

evaluacionesRouter.post('/asignaturas/:id/evaluaciones', requireRol(), async (req, res) => {
  const a = await asignaturaEditable(req, res, idDe(req.params.id))
  if (!a) return
  const data = datosEvaluacion(req.body, true)
  if (typeof data === 'string') return void res.status(400).json({ error: data })
  res.status(201).json(await prisma.evaluacion.create({ data: { ...(data as Required<typeof data>), asignaturaId: a.id }, select: evaluacionPublica }))
})

evaluacionesRouter.patch('/evaluaciones/:id', async (req, res) => {
  const e = await evaluacionEditable(req, res)
  if (!e) return
  const data = datosEvaluacion(req.body, false)
  if (typeof data === 'string') return void res.status(400).json({ error: data })
  res.json(await prisma.evaluacion.update({ where: { id: e.id }, data, select: evaluacionPublica }))
})

evaluacionesRouter.delete('/evaluaciones/:id', async (req, res) => {
  const e = await evaluacionEditable(req, res)
  if (!e) return
  await prisma.evaluacion.delete({ where: { id: e.id } }) // sus notas caen en cascada
  res.status(204).end()
})

// ── Notas ──────────────────────────────────────────────────────────────────

/** Las notas del alumno con sesión, por asignatura, con su media ponderada. */
evaluacionesRouter.get('/notas', requireRol('alumno'), async (req, res) => {
  const asignaturas = await prisma.asignatura.findMany({
    where: { evaluaciones: { some: {} } },
    orderBy: { nombre: 'asc' },
    select: {
      id: true, nombre: true,
      evaluaciones: {
        orderBy: { fecha: 'asc' },
        select: { id: true, titulo: true, tipo: true, fecha: true, peso: true, notas: { where: { alumnoId: req.usuario!.id }, select: { nota: true, comentario: true } } },
      },
    },
  })
  res.json(asignaturas.map((a) => {
    const evaluaciones = a.evaluaciones.map(({ notas, ...e }) => ({ ...e, nota: notas[0]?.nota ?? null, comentario: notas[0]?.comentario ?? null }))
    return { id: a.id, nombre: a.nombre, evaluaciones, media: media(evaluaciones) }
  }))
})

/** Cuaderno del profesor: todas las notas de una asignatura suya (alumnos × evaluaciones). */
evaluacionesRouter.get('/asignaturas/:id/notas', requireRol(), async (req, res) => {
  const a = await asignaturaEditable(req, res, idDe(req.params.id))
  if (!a) return
  const [evaluaciones, alumnos, notas] = await Promise.all([
    prisma.evaluacion.findMany({ where: { asignaturaId: a.id }, orderBy: { fecha: 'asc' }, select: { id: true, titulo: true, tipo: true, fecha: true, peso: true } }),
    prisma.usuario.findMany({ where: { rol: 'alumno' }, orderBy: { nombre: 'asc' }, select: { id: true, nombre: true } }),
    prisma.nota.findMany({ where: { evaluacion: { asignaturaId: a.id } }, select: { evaluacionId: true, alumnoId: true, nota: true, comentario: true } }),
  ])
  res.json({ asignatura: { id: a.id, nombre: a.nombre }, evaluaciones, alumnos, notas })
})

/** Poner, cambiar o quitar (nota vacía) la nota de un alumno. */
evaluacionesRouter.put('/evaluaciones/:id/notas/:alumnoId', async (req, res) => {
  const e = await evaluacionEditable(req, res)
  if (!e) return
  const alumno = await prisma.usuario.findUnique({ where: { id: idDe(req.params.alumnoId) } })
  if (alumno?.rol !== 'alumno') return void res.status(404).json({ error: 'Ese alumno no existe' })
  const clave = { evaluacionId_alumnoId: { evaluacionId: e.id, alumnoId: alumno.id } }

  if (req.body?.nota === null || req.body?.nota === '') {
    await prisma.nota.deleteMany({ where: { evaluacionId: e.id, alumnoId: alumno.id } })
    return void res.status(204).end()
  }
  const nota = Number(req.body?.nota)
  if (!(nota >= 0 && nota <= 10)) return void res.status(400).json({ error: 'La nota va de 0 a 10' })
  const comentario = texto(req.body?.comentario) || null
  res.json(await prisma.nota.upsert({
    where: clave,
    create: { evaluacionId: e.id, alumnoId: alumno.id, nota, comentario },
    update: { nota, comentario },
    select: { evaluacionId: true, alumnoId: true, nota: true, comentario: true },
  }))
})
