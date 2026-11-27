// Bloque C: propuestas de proyectos y ofertas de trabajo/prácticas (docs/PLAN.md §2).
import { Router, type Response } from 'express'
import { requireRol } from '../auth.js'
import { prisma } from '../db.js'
import { EstadoPropuesta, TipoOferta } from '../generated/prisma/enums.js'
import { esDuplicado, esUrl, idDe, texto } from '../validar.js'

export const comunidadRouter = Router()
comunidadRouter.use(['/propuestas', '/ofertas', '/skills'], requireRol())

const error = (res: Response, status: number, mensaje: string) => void res.status(status).json({ error: mensaje })

// ── Propuestas ─────────────────────────────────────────────────────────────

comunidadRouter.get('/propuestas', async (req, res) => {
  const propuestas = await prisma.propuesta.findMany({
    orderBy: { creadoEn: 'desc' },
    select: {
      id: true, titulo: true, descripcionMd: true, tecnologias: true, estado: true, creadoEn: true,
      autor: { select: { id: true, nombre: true } },
      _count: { select: { interesados: true } },
      interesados: { where: { usuarioId: req.usuario!.id }, select: { usuarioId: true } },
    },
  })
  res.json(propuestas.map(({ interesados, ...p }) => ({ ...p, meInteresa: interesados.length > 0 })))
})

comunidadRouter.post('/propuestas', async (req, res) => {
  const titulo = texto(req.body?.titulo)
  const descripcionMd = texto(req.body?.descripcionMd)
  if (!titulo || !descripcionMd) return error(res, 400, 'Pon un título y explica la idea')
  // "Node, Express, Prisma" o ["Node", "Express"]
  const lista: unknown[] = Array.isArray(req.body?.tecnologias) ? req.body.tecnologias : String(req.body?.tecnologias ?? '').split(',')
  const tecnologias = [...new Set(lista.map(texto).filter(Boolean))].slice(0, 8)
  res.status(201).json(await prisma.propuesta.create({ data: { titulo, descripcionMd, tecnologias, autorId: req.usuario!.id } }))
})

comunidadRouter.put('/propuestas/:id/interes', async (req, res) => {
  const p = await prisma.propuesta.findUnique({ where: { id: idDe(req.params.id) } })
  if (!p) return error(res, 404, 'Esa propuesta no existe')
  await prisma.propuestaInteres.create({ data: { propuestaId: p.id, usuarioId: req.usuario!.id } }).catch((e) => {
    if (!esDuplicado(e)) throw e // ya estaba apuntado: no pasa nada
  })
  res.status(204).end()
})

comunidadRouter.delete('/propuestas/:id/interes', async (req, res) => {
  await prisma.propuestaInteres.deleteMany({ where: { propuestaId: idDe(req.params.id), usuarioId: req.usuario!.id } })
  res.status(204).end()
})

comunidadRouter.patch('/propuestas/:id', requireRol('profesor', 'admin'), async (req, res) => {
  if (!Object.values(EstadoPropuesta).includes(req.body?.estado)) return error(res, 400, 'Estado no válido')
  const p = await prisma.propuesta.findUnique({ where: { id: idDe(req.params.id) } })
  if (!p) return error(res, 404, 'Esa propuesta no existe')
  res.json(await prisma.propuesta.update({ where: { id: p.id }, data: { estado: req.body.estado } }))
})

comunidadRouter.delete('/propuestas/:id', async (req, res) => {
  const p = await prisma.propuesta.findUnique({ where: { id: idDe(req.params.id) } })
  if (!p) return error(res, 404, 'Esa propuesta no existe')
  if (p.autorId !== req.usuario!.id && req.usuario!.rol !== 'admin') return error(res, 403, 'Solo quien la propuso puede borrarla')
  await prisma.propuesta.delete({ where: { id: p.id } })
  res.status(204).end()
})

// ── Ofertas ────────────────────────────────────────────────────────────────

const ofertaPublica = {
  id: true, titulo: true, empresa: true, url: true, ubicacion: true, tipo: true, aprobada: true,
  autor: { select: { id: true, nombre: true } },
} as const

/** El alumno ve las aprobadas y las suyas pendientes; profesor y admin, todas (para aprobarlas). */
comunidadRouter.get('/ofertas', async (req, res) => {
  const u = req.usuario!
  res.json(await prisma.oferta.findMany({
    where: u.rol === 'alumno' ? { OR: [{ aprobada: true }, { autorId: u.id }] } : {},
    orderBy: [{ aprobada: 'asc' }, { id: 'desc' }],
    select: ofertaPublica,
  }))
})

comunidadRouter.post('/ofertas', async (req, res) => {
  const titulo = texto(req.body?.titulo)
  const empresa = texto(req.body?.empresa)
  const url = texto(req.body?.url)
  if (!titulo || !empresa) return error(res, 400, 'Pon el puesto y la empresa')
  if (!esUrl(url)) return error(res, 400, 'Pon el enlace a la oferta (https://…)')
  if (!Object.values(TipoOferta).includes(req.body?.tipo)) return error(res, 400, 'Tipo no válido')
  // La de un alumno queda pendiente hasta que un profesor la apruebe
  res.status(201).json(await prisma.oferta.create({
    data: { titulo, empresa, url, ubicacion: texto(req.body?.ubicacion) || null, tipo: req.body.tipo, autorId: req.usuario!.id, aprobada: req.usuario!.rol !== 'alumno' },
    select: ofertaPublica,
  }))
})

comunidadRouter.patch('/ofertas/:id/aprobar', requireRol('profesor', 'admin'), async (req, res) => {
  const o = await prisma.oferta.findUnique({ where: { id: idDe(req.params.id) } })
  if (!o) return error(res, 404, 'Esa oferta no existe')
  res.json(await prisma.oferta.update({ where: { id: o.id }, data: { aprobada: true }, select: ofertaPublica }))
})

comunidadRouter.delete('/ofertas/:id', async (req, res) => {
  const o = await prisma.oferta.findUnique({ where: { id: idDe(req.params.id) } })
  if (!o) return error(res, 404, 'Esa oferta no existe')
  if (o.autorId !== req.usuario!.id && req.usuario!.rol === 'alumno') return error(res, 403, 'Solo puedes borrar tus ofertas')
  await prisma.oferta.delete({ where: { id: o.id } })
  res.status(204).end()
})

// ── Skills ─────────────────────────────────────────────────────────────────
// Son recursos sin tema (tipo = skill). La de un alumno queda oculta (visible = false) hasta que la aprueba un profesor.

export const CATEGORIAS = ['frontend', 'backend', 'bases de datos', 'devops', 'ia', 'diseño', 'herramientas'] as const


const skillPublica = {
  id: true, titulo: true, url: true, categoria: true, contenidoMd: true, visible: true, creadoEn: true,
  autor: { select: { id: true, nombre: true } },
} as const

comunidadRouter.get('/skills', async (req, res) => {
  const u = req.usuario!
  res.json(await prisma.recurso.findMany({
    where: { tipo: 'skill', temaId: null, ...(u.rol === 'alumno' ? { OR: [{ visible: true }, { autorId: u.id }] } : {}) },
    orderBy: [{ categoria: 'asc' }, { titulo: 'asc' }],
    select: skillPublica,
  }))
})

comunidadRouter.post('/skills', async (req, res) => {
  const titulo = texto(req.body?.titulo)
  const url = texto(req.body?.url)
  const categoria = texto(req.body?.categoria).toLowerCase()
  if (!titulo) return error(res, 400, 'Pon un título')
  if (!esUrl(url)) return error(res, 400, 'Pon el enlace (https://…)')
  if (!(CATEGORIAS as readonly string[]).includes(categoria)) return error(res, 400, 'Categoría no válida')
  res.status(201).json(await prisma.recurso.create({
    data: { tipo: 'skill', titulo, url, categoria, contenidoMd: texto(req.body?.contenidoMd) || null, autorId: req.usuario!.id, visible: req.usuario!.rol !== 'alumno' },
    select: skillPublica,
  }))
})

/** La skill de la URL (solo las que son skills, no los recursos de un tema). */
const skillDe = (id: unknown) => prisma.recurso.findFirst({ where: { id: idDe(id), tipo: 'skill', temaId: null } })

comunidadRouter.patch('/skills/:id/aprobar', requireRol('profesor', 'admin'), async (req, res) => {
  const s = await skillDe(req.params.id)
  if (!s) return error(res, 404, 'Esa skill no existe')
  res.json(await prisma.recurso.update({ where: { id: s.id }, data: { visible: true }, select: skillPublica }))
})

comunidadRouter.delete('/skills/:id', async (req, res) => {
  const s = await skillDe(req.params.id)
  if (!s) return error(res, 404, 'Esa skill no existe')
  if (s.autorId !== req.usuario!.id && req.usuario!.rol === 'alumno') return error(res, 403, 'Solo puedes borrar tus skills')
  await prisma.recurso.delete({ where: { id: s.id } })
  res.status(204).end()
})
