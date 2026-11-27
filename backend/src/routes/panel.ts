import { Router } from 'express'
import { requireRol } from '../auth.js'
import { prisma } from '../db.js'
import { publicados } from './asignaturas.js'

// Panel "Hoy": lo próximo, los retos abiertos y lo último publicado (docs/PLAN.md §7). Solo lectura.
export const panelRouter = Router()

panelRouter.get('/panel', requireRol(), async (req, res) => {
  const ahora = new Date()
  const [proximas, retos, recientes] = await Promise.all([
    prisma.evaluacion.findMany({
      where: { fecha: { gte: ahora } },
      orderBy: { fecha: 'asc' },
      take: 5,
      select: { id: true, titulo: true, tipo: true, fecha: true, asignatura: { select: { id: true, nombre: true } } },
    }),
    prisma.reto.findMany({
      where: { inicio: { lte: ahora }, fin: { gte: ahora } },
      orderBy: { fin: 'asc' },
      select: {
        id: true, titulo: true, fin: true, maxMiembros: true,
        _count: { select: { equipos: true } },
        // El equipo del usuario en ese reto, si tiene
        equipos: { where: { miembros: { some: { usuarioId: req.usuario!.id } } }, select: { nombre: true, _count: { select: { miembros: true } } } },
      },
    }),
    prisma.recurso.findMany({
      where: { temaId: { not: null }, ...publicados() },
      orderBy: { creadoEn: 'desc' },
      take: 6,
      select: {
        id: true, tipo: true, titulo: true, creadoEn: true, archivoNombre: true,
        autor: { select: { nombre: true } },
        tema: { select: { asignatura: { select: { id: true, nombre: true } } } },
      },
    }),
  ])
  res.json({ proximas, retos, recientes })
})
