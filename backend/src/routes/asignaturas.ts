// Bloque B: asignaturas → temas → recursos, con visibilidad y archivos (docs/PLAN.md §2 y §3).
import { randomUUID } from 'node:crypto'
import { Router, type Request, type Response } from 'express'
import { requireRol, type UsuarioSesion } from '../auth.js'
import { prisma } from '../db.js'
import type { Prisma } from '../generated/prisma/client.js'
import { borrarArchivo, urlDeDescarga, urlDeSubida } from '../storage.js'

export const asignaturasRouter = Router()
asignaturasRouter.use(['/asignaturas', '/temas', '/recursos'], requireRol())

/** Lo que ve la clase: recursos visibles y, si están programados, con la fecha ya pasada. */
export const publicados = (): Prisma.RecursoWhereInput => ({
  visible: true,
  OR: [{ visibleDesde: null }, { visibleDesde: { lte: new Date() } }],
})
const estaPublicado = (r: { visible: boolean; visibleDesde: Date | null }) =>
  r.visible && (!r.visibleDesde || r.visibleDesde <= new Date())

/** El profesor de la asignatura o un admin. Otro profesor solo ve lo publicado, como un alumno. */
const puedeEditar = (u: UsuarioSesion, profesorId: number) => u.rol === 'admin' || u.id === profesorId

const texto = (v: unknown) => String(v ?? '').trim()
/** Id de la URL; si no es un número, uno que no existe (→ 404 en vez de un error de Prisma). */
const idDe = (v: string) => (/^\d+$/.test(v) ? Number(v) : -1)

const recursoPublico = {
  id: true, tipo: true, titulo: true, contenidoMd: true, url: true,
  archivoNombre: true, archivoBytes: true, visible: true, visibleDesde: true, creadoEn: true,
} as const

// Cargan el elemento y comprueban que el usuario puede editarlo. Si no, responden 404/403 y devuelven null.
async function asignaturaEditable(req: Request, res: Response) {
  const a = await prisma.asignatura.findUnique({ where: { id: idDe(String(req.params.id)) } })
  return comprobar(req, res, a, a?.profesorId)
}
async function temaEditable(req: Request, res: Response) {
  const t = await prisma.tema.findUnique({ where: { id: idDe(String(req.params.id)) }, include: { asignatura: true } })
  return comprobar(req, res, t, t?.asignatura.profesorId)
}
async function recursoEditable(req: Request, res: Response) {
  const r = await prisma.recurso.findUnique({ where: { id: idDe(String(req.params.id)) }, include: { tema: { include: { asignatura: true } } } })
  // Un recurso sin tema (skill) es de quien lo creó
  return comprobar(req, res, r, r && (r.tema?.asignatura.profesorId ?? r.autorId))
}
function comprobar<T>(req: Request, res: Response, item: T | null, profesorId: number | null | undefined) {
  if (!item) {
    res.status(404).json({ error: 'No existe' })
    return null
  }
  if (!puedeEditar(req.usuario!, profesorId!)) {
    res.status(403).json({ error: 'Solo el profesor de la asignatura puede cambiar esto' })
    return null
  }
  return item
}

// ── Asignaturas ────────────────────────────────────────────────────────────

asignaturasRouter.get('/asignaturas', async (_req, res) => {
  res.json(await prisma.asignatura.findMany({
    orderBy: { nombre: 'asc' },
    select: { id: true, nombre: true, curso: true, profesor: { select: { id: true, nombre: true } }, _count: { select: { temas: true } } },
  }))
})

asignaturasRouter.post('/asignaturas', requireRol('profesor', 'admin'), async (req, res) => {
  const nombre = texto(req.body?.nombre)
  const curso = texto(req.body?.curso)
  if (!nombre || !curso) return void res.status(400).json({ error: 'Pon el nombre y el curso' })

  // Un profesor crea asignaturas suyas; un admin puede asignarlas a otro profesor
  let profesorId = req.usuario!.id
  if (req.usuario!.rol === 'admin' && req.body?.profesorId) {
    const p = await prisma.usuario.findUnique({ where: { id: idDe(String(req.body.profesorId)) } })
    if (!p || p.rol === 'alumno') return void res.status(400).json({ error: 'Ese profesor no existe' })
    profesorId = p.id
  }
  res.status(201).json(await prisma.asignatura.create({ data: { nombre, curso, profesorId } }))
})

asignaturasRouter.get('/asignaturas/:id', async (req, res) => {
  const a = await prisma.asignatura.findUnique({
    where: { id: idDe(req.params.id) },
    select: { id: true, nombre: true, curso: true, profesorId: true, profesor: { select: { id: true, nombre: true } } },
  })
  if (!a) return void res.status(404).json({ error: 'Esa asignatura no existe' })

  const editable = puedeEditar(req.usuario!, a.profesorId)
  const temas = await prisma.tema.findMany({
    where: { asignaturaId: a.id },
    orderBy: [{ orden: 'asc' }, { id: 'asc' }],
    // El profesor ve también lo oculto y lo programado (con su estado); el resto, solo lo publicado
    select: { id: true, titulo: true, orden: true, recursos: { where: editable ? {} : publicados(), orderBy: { creadoEn: 'asc' }, select: recursoPublico } },
  })
  res.json({ ...a, editable, temas })
})

asignaturasRouter.patch('/asignaturas/:id', async (req, res) => {
  if (!(await asignaturaEditable(req, res))) return
  const nombre = texto(req.body?.nombre)
  const curso = texto(req.body?.curso)
  if (!nombre || !curso) return void res.status(400).json({ error: 'Pon el nombre y el curso' })
  res.json(await prisma.asignatura.update({ where: { id: idDe(req.params.id) }, data: { nombre, curso } }))
})

asignaturasRouter.delete('/asignaturas/:id', async (req, res) => {
  const a = await asignaturaEditable(req, res)
  if (!a) return
  const recursos = await prisma.recurso.findMany({ where: { tema: { asignaturaId: a.id } } })
  await prisma.asignatura.delete({ where: { id: a.id } }) // temas y recursos caen en cascada
  await borrarArchivos(recursos)
  res.status(204).end()
})

// ── Temas ──────────────────────────────────────────────────────────────────

asignaturasRouter.post('/asignaturas/:id/temas', async (req, res) => {
  const a = await asignaturaEditable(req, res)
  if (!a) return
  const titulo = texto(req.body?.titulo)
  if (!titulo) return void res.status(400).json({ error: 'Pon el título del tema' })
  const { _max } = await prisma.tema.aggregate({ where: { asignaturaId: a.id }, _max: { orden: true } })
  res.status(201).json(await prisma.tema.create({ data: { asignaturaId: a.id, titulo, orden: (_max.orden ?? 0) + 1 } }))
})

asignaturasRouter.patch('/temas/:id', async (req, res) => {
  const t = await temaEditable(req, res)
  if (!t) return
  const titulo = req.body?.titulo === undefined ? t.titulo : texto(req.body.titulo)
  const orden = req.body?.orden === undefined ? t.orden : Number(req.body.orden)
  if (!titulo || !Number.isInteger(orden)) return void res.status(400).json({ error: 'Título u orden no válidos' })
  res.json(await prisma.tema.update({ where: { id: t.id }, data: { titulo, orden } }))
})

asignaturasRouter.delete('/temas/:id', async (req, res) => {
  const t = await temaEditable(req, res)
  if (!t) return
  const recursos = await prisma.recurso.findMany({ where: { temaId: t.id } })
  await prisma.tema.delete({ where: { id: t.id } })
  await borrarArchivos(recursos)
  res.status(204).end()
})

// ── Recursos ───────────────────────────────────────────────────────────────

const TIPOS = ['apunte', 'video', 'enlace', 'proyecto'] as const

/** Valida el cuerpo de crear/editar un recurso. Devuelve los datos o un mensaje de error. */
function datosRecurso(body: any, crear: boolean): Prisma.RecursoUncheckedUpdateInput | string {
  const data: Prisma.RecursoUncheckedUpdateInput = {}
  if (crear || body?.tipo !== undefined) {
    if (!TIPOS.includes(body?.tipo)) return 'Tipo de recurso no válido'
    data.tipo = body.tipo
  }
  if (crear || body?.titulo !== undefined) {
    if (!texto(body?.titulo)) return 'Pon un título'
    data.titulo = texto(body.titulo)
  }
  if (body?.url !== undefined) {
    const url = texto(body.url)
    if (url && !/^https?:\/\/\S+$/i.test(url)) return 'El enlace tiene que empezar por http:// o https://'
    data.url = url || null
  }
  if (crear && ['video', 'enlace'].includes(body?.tipo) && !data.url) return 'Un vídeo o un enlace necesita su URL'
  if (body?.contenidoMd !== undefined) data.contenidoMd = texto(body.contenidoMd) || null
  if (body?.visible !== undefined) data.visible = body.visible === true
  if (body?.visibleDesde !== undefined) {
    const fecha = body.visibleDesde ? new Date(body.visibleDesde) : null
    if (fecha && Number.isNaN(fecha.getTime())) return 'Fecha de publicación no válida'
    data.visibleDesde = fecha
  }
  return data
}

asignaturasRouter.post('/temas/:id/recursos', async (req, res) => {
  const t = await temaEditable(req, res)
  if (!t) return
  const data = datosRecurso(req.body, true)
  if (typeof data === 'string') return void res.status(400).json({ error: data })
  const r = await prisma.recurso.create({
    data: { ...(data as Prisma.RecursoUncheckedCreateInput), temaId: t.id, autorId: req.usuario!.id },
    select: recursoPublico,
  })
  res.status(201).json(r)
})

asignaturasRouter.patch('/recursos/:id', async (req, res) => {
  const r = await recursoEditable(req, res)
  if (!r) return
  const data = datosRecurso(req.body, false)
  if (typeof data === 'string') return void res.status(400).json({ error: data })
  res.json(await prisma.recurso.update({ where: { id: r.id }, data, select: recursoPublico }))
})

asignaturasRouter.delete('/recursos/:id', async (req, res) => {
  const r = await recursoEditable(req, res)
  if (!r) return
  await prisma.recurso.delete({ where: { id: r.id } })
  await borrarArchivos([r])
  res.status(204).end()
})

// ── Archivos ───────────────────────────────────────────────────────────────

const MAX_BYTES = 20 * 1024 * 1024
// PDF, imágenes, ZIP y código. Sin SVG ni HTML ejecutable fuera de un ZIP.
const EXTENSIONES = /\.(pdf|png|jpe?g|gif|webp|zip|txt|md|json|ts|js|css|html|java|py|sql|php|c|cpp|cs|kt|xml|ya?ml)$/i

/** Paso 1 de la subida: el back valida y devuelve una URL firmada; el navegador sube el archivo directamente a Supabase. */
asignaturasRouter.post('/recursos/:id/archivo', async (req, res) => {
  const r = await recursoEditable(req, res)
  if (!r) return
  const nombre = texto(req.body?.nombre).slice(-120)
  const bytes = Number(req.body?.bytes)
  if (!EXTENSIONES.test(nombre)) return void res.status(400).json({ error: 'Solo se aceptan PDF, imágenes, ZIP y archivos de código' })
  if (!(bytes > 0 && bytes <= MAX_BYTES)) return void res.status(400).json({ error: 'El archivo tiene que pesar menos de 20 MB' })

  const path = `${r.id}/${randomUUID()}-${nombre.normalize('NFD').replace(/\p{M}/gu, '').replace(/[^\w.-]/g, '_')}`
  const uploadUrl = await urlDeSubida(path)
  // ponytail: la ruta se guarda antes de que termine la subida; si el navegador falla, la descarga dará 404 hasta que se vuelva a subir.
  await prisma.recurso.update({ where: { id: r.id }, data: { archivoPath: path, archivoNombre: nombre, archivoBytes: bytes } })
  await borrarArchivos([r]) // el anterior, si lo había
  res.json({ uploadUrl })
})

asignaturasRouter.delete('/recursos/:id/archivo', async (req, res) => {
  const r = await recursoEditable(req, res)
  if (!r) return
  await prisma.recurso.update({ where: { id: r.id }, data: { archivoPath: null, archivoNombre: null, archivoBytes: null } })
  await borrarArchivos([r])
  res.status(204).end()
})

/** Descarga: se comprueba la visibilidad y se redirige a una URL firmada de 5 minutos. */
asignaturasRouter.get('/recursos/:id/archivo', async (req, res) => {
  const r = await prisma.recurso.findUnique({ where: { id: idDe(req.params.id) }, include: { tema: { include: { asignatura: true } } } })
  const profesorId = r?.tema?.asignatura.profesorId ?? r?.autorId
  if (!r?.archivoPath || !(estaPublicado(r) || puedeEditar(req.usuario!, profesorId!))) {
    return void res.status(404).json({ error: 'Ese archivo no existe' }) // 404 también si está oculto: no se revela que existe
  }
  res.redirect(302, await urlDeDescarga(r.archivoPath, r.archivoNombre ?? 'archivo'))
})

/** Borra de Storage los archivos de esos recursos. Un fallo aquí deja un archivo huérfano, nunca datos rotos. */
async function borrarArchivos(recursos: { archivoPath: string | null }[]) {
  for (const { archivoPath } of recursos) {
    if (archivoPath) await borrarArchivo(archivoPath).catch((e) => console.error('No se pudo borrar', archivoPath, e))
  }
}
