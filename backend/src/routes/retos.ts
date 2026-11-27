// Bloque C: retos / hackathons con equipos, entregas y votos (docs/PLAN.md §2).
// Reglas: un alumno, un equipo por reto y un voto por reto (las garantiza la BD); nunca a tu propio equipo (API).
import { Router, type Request, type Response } from 'express'
import { requireRol } from '../auth.js'
import { prisma } from '../db.js'
import { esDuplicado, esUrl, fecha, idDe, texto } from '../validar.js'

export const retosRouter = Router()
retosRouter.use(['/retos', '/equipos'], requireRol())

type Estado = 'proximo' | 'abierto' | 'cerrado'
const estado = (r: { inicio: Date; fin: Date }, ahora = new Date()): Estado =>
  ahora < r.inicio ? 'proximo' : ahora <= r.fin ? 'abierto' : 'cerrado'

const puedeGestionar = (req: Request, r: { creadoPorId: number }) => req.usuario!.rol === 'admin' || req.usuario!.id === r.creadoPorId

/** El equipo del usuario en ese reto, si tiene. */
const miEquipo = (retoId: number, usuarioId: number) =>
  prisma.equipoMiembro.findUnique({ where: { retoId_usuarioId: { retoId, usuarioId } } })

function error(res: Response, status: number, mensaje: string) {
  res.status(status).json({ error: mensaje })
}

// ── Retos ──────────────────────────────────────────────────────────────────

retosRouter.get('/retos', async (req, res) => {
  const retos = await prisma.reto.findMany({
    orderBy: { inicio: 'desc' },
    select: {
      id: true, titulo: true, inicio: true, fin: true, maxMiembros: true,
      asignatura: { select: { id: true, nombre: true } },
      _count: { select: { equipos: true } },
      equipos: { where: { miembros: { some: { usuarioId: req.usuario!.id } } }, select: { id: true, nombre: true } },
    },
  })
  res.json(retos.map(({ equipos, ...r }) => ({ ...r, estado: estado(r), miEquipo: equipos[0] ?? null })))
})

function datosReto(body: any) {
  const titulo = texto(body?.titulo)
  const descripcionMd = texto(body?.descripcionMd)
  const inicio = fecha(body?.inicio)
  const fin = fecha(body?.fin)
  const maxMiembros = body?.maxMiembros ? Number(body.maxMiembros) : 4
  if (!titulo || !descripcionMd) return 'Pon un título y una descripción'
  if (!inicio || !fin || fin <= inicio) return 'El reto tiene que acabar después de empezar'
  if (!(Number.isInteger(maxMiembros) && maxMiembros >= 1 && maxMiembros <= 10)) return 'Los equipos son de 1 a 10 personas'
  const asignaturaId = body?.asignaturaId ? idDe(body.asignaturaId) : null
  return { titulo, descripcionMd, inicio, fin, maxMiembros, asignaturaId }
}

retosRouter.post('/retos', requireRol('profesor', 'admin'), async (req, res) => {
  const data = datosReto(req.body)
  if (typeof data === 'string') return error(res, 400, data)
  if (data.asignaturaId && !(await prisma.asignatura.findUnique({ where: { id: data.asignaturaId } }))) return error(res, 400, 'Esa asignatura no existe')
  res.status(201).json(await prisma.reto.create({ data: { ...data, creadoPorId: req.usuario!.id } }))
})

retosRouter.get('/retos/:id', async (req, res) => {
  const r = await prisma.reto.findUnique({
    where: { id: idDe(req.params.id) },
    include: {
      asignatura: { select: { id: true, nombre: true } },
      creadoPor: { select: { nombre: true } },
      equipos: {
        orderBy: { id: 'asc' },
        include: {
          miembros: { select: { usuario: { select: { id: true, nombre: true, githubUsername: true } } } },
          _count: { select: { votos: true } },
        },
      },
    },
  })
  if (!r) return error(res, 404, 'Ese reto no existe')
  const yo = req.usuario!
  const est = estado(r)
  const gestiona = puedeGestionar(req, r)
  const voto = await prisma.voto.findUnique({ where: { retoId_usuarioId: { retoId: r.id, usuarioId: yo.id } } })
  // Los votos se ven al cerrar el reto (antes, solo quien lo gestiona), para no influir en la votación
  const verVotos = est === 'cerrado' || gestiona
  res.json({
    id: r.id, titulo: r.titulo, descripcionMd: r.descripcionMd, inicio: r.inicio, fin: r.fin, maxMiembros: r.maxMiembros,
    asignatura: r.asignatura, creadoPor: r.creadoPor, estado: est, puedeGestionar: gestiona,
    miEquipoId: r.equipos.find((e) => e.miembros.some((m) => m.usuario.id === yo.id))?.id ?? null,
    miVotoEquipoId: voto?.equipoId ?? null,
    equipos: r.equipos.map((e) => ({
      id: e.id, nombre: e.nombre, repoUrl: e.repoUrl, demoUrl: e.demoUrl, entregadoEn: e.entregadoEn,
      miembros: e.miembros.map((m) => m.usuario),
      votos: verVotos ? e._count.votos : null,
    })),
  })
})

retosRouter.patch('/retos/:id', async (req, res) => {
  const r = await prisma.reto.findUnique({ where: { id: idDe(req.params.id) } })
  if (!r) return error(res, 404, 'Ese reto no existe')
  if (!puedeGestionar(req, r)) return error(res, 403, 'Solo quien creó el reto puede cambiarlo')
  const data = datosReto({ ...r, ...req.body })
  if (typeof data === 'string') return error(res, 400, data)
  res.json(await prisma.reto.update({ where: { id: r.id }, data }))
})

retosRouter.delete('/retos/:id', async (req, res) => {
  const r = await prisma.reto.findUnique({ where: { id: idDe(req.params.id) } })
  if (!r) return error(res, 404, 'Ese reto no existe')
  if (!puedeGestionar(req, r)) return error(res, 403, 'Solo quien creó el reto puede borrarlo')
  await prisma.reto.delete({ where: { id: r.id } })
  res.status(204).end()
})

// ── Equipos (solo alumnos) ─────────────────────────────────────────────────

retosRouter.post('/retos/:id/equipos', requireRol('alumno'), async (req, res) => {
  const r = await prisma.reto.findUnique({ where: { id: idDe(req.params.id) } })
  if (!r) return error(res, 404, 'Ese reto no existe')
  if (estado(r) === 'cerrado') return error(res, 400, 'El reto ya ha terminado')
  const nombre = texto(req.body?.nombre).slice(0, 40)
  if (!nombre) return error(res, 400, 'Ponle nombre al equipo')
  if (await miEquipo(r.id, req.usuario!.id)) return error(res, 409, 'Ya tienes equipo en este reto')
  try {
    const equipo = await prisma.$transaction(async (tx) => {
      const nuevo = await tx.equipo.create({ data: { retoId: r.id, nombre } })
      await tx.equipoMiembro.create({ data: { equipoId: nuevo.id, retoId: r.id, usuarioId: req.usuario!.id } })
      return nuevo
    })
    res.status(201).json(equipo)
  } catch (e) {
    if (esDuplicado(e)) return error(res, 409, 'Ya hay un equipo con ese nombre')
    throw e
  }
})

/** Carga el equipo y su reto. */
const equipoConReto = (id: unknown) =>
  prisma.equipo.findUnique({ where: { id: idDe(id) }, include: { reto: true, _count: { select: { miembros: true } } } })

retosRouter.post('/equipos/:id/unirse', requireRol('alumno'), async (req, res) => {
  const e = await equipoConReto(req.params.id)
  if (!e) return error(res, 404, 'Ese equipo no existe')
  if (estado(e.reto) === 'cerrado') return error(res, 400, 'El reto ya ha terminado')
  if (e._count.miembros >= e.reto.maxMiembros) return error(res, 400, 'El equipo está completo')
  try {
    await prisma.equipoMiembro.create({ data: { equipoId: e.id, retoId: e.retoId, usuarioId: req.usuario!.id } })
  } catch (err) {
    if (esDuplicado(err)) return error(res, 409, 'Ya tienes equipo en este reto') // UNIQUE(retoId, usuarioId)
    throw err
  }
  res.status(204).end()
})

retosRouter.post('/equipos/:id/salir', requireRol('alumno'), async (req, res) => {
  const e = await equipoConReto(req.params.id)
  if (!e) return error(res, 404, 'Ese equipo no existe')
  if (estado(e.reto) === 'cerrado') return error(res, 400, 'El reto ya ha terminado')
  const { count } = await prisma.equipoMiembro.deleteMany({ where: { equipoId: e.id, usuarioId: req.usuario!.id } })
  if (!count) return error(res, 400, 'No estás en ese equipo')
  // Un equipo sin nadie desaparece
  if (e._count.miembros === 1) await prisma.equipo.delete({ where: { id: e.id } })
  res.status(204).end()
})

retosRouter.patch('/equipos/:id/entrega', requireRol('alumno'), async (req, res) => {
  const e = await equipoConReto(req.params.id)
  if (!e) return error(res, 404, 'Ese equipo no existe')
  if (!(await prisma.equipoMiembro.findUnique({ where: { equipoId_usuarioId: { equipoId: e.id, usuarioId: req.usuario!.id } } }))) {
    return error(res, 403, 'Solo los miembros del equipo pueden entregar')
  }
  if (estado(e.reto) !== 'abierto') return error(res, 400, 'Solo se entrega mientras el reto está abierto')
  const repoUrl = texto(req.body?.repoUrl)
  const demoUrl = texto(req.body?.demoUrl)
  if (!esUrl(repoUrl)) return error(res, 400, 'Pon la URL del repositorio (https://…)')
  if (demoUrl && !esUrl(demoUrl)) return error(res, 400, 'La demo tiene que ser una URL (https://…)')
  res.json(await prisma.equipo.update({ where: { id: e.id }, data: { repoUrl, demoUrl: demoUrl || null, entregadoEn: new Date() } }))
})

// ── Votos (solo alumnos) ───────────────────────────────────────────────────

retosRouter.put('/retos/:id/voto', requireRol('alumno'), async (req, res) => {
  const r = await prisma.reto.findUnique({ where: { id: idDe(req.params.id) } })
  if (!r) return error(res, 404, 'Ese reto no existe')
  if (estado(r) === 'proximo') return error(res, 400, 'El reto aún no ha empezado')
  const equipo = await prisma.equipo.findUnique({ where: { id: idDe(req.body?.equipoId) } })
  if (!equipo || equipo.retoId !== r.id) return error(res, 400, 'Ese equipo no es de este reto')
  if (!equipo.entregadoEn) return error(res, 400, 'Solo se vota a equipos que han entregado')
  const mio = await miEquipo(r.id, req.usuario!.id)
  if (mio?.equipoId === equipo.id) return error(res, 400, 'No puedes votar a tu propio equipo')

  const clave = { retoId_usuarioId: { retoId: r.id, usuarioId: req.usuario!.id } }
  await prisma.voto.upsert({ where: clave, create: { retoId: r.id, equipoId: equipo.id, usuarioId: req.usuario!.id }, update: { equipoId: equipo.id } })
  res.status(204).end()
})
