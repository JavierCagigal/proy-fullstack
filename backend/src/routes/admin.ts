import { Router } from 'express'
import { requireRol, usuarioPublico } from '../auth.js'
import { prisma } from '../db.js'
import { Rol } from '../generated/prisma/enums.js'

// Gestión de usuarios y roles: solo admin (docs/PLAN.md §2)
export const adminRouter = Router()
adminRouter.use('/admin', requireRol('admin'))

adminRouter.get('/admin/usuarios', async (_req, res) => {
  res.json(await prisma.usuario.findMany({ select: { ...usuarioPublico, creadoEn: true }, orderBy: { nombre: 'asc' } }))
})

adminRouter.patch('/admin/usuarios/:id', async (req, res) => {
  const id = Number(req.params.id)
  const rol = req.body?.rol
  if (!Object.values(Rol).includes(rol)) return void res.status(400).json({ error: 'Rol no válido' })
  // Evita que el último admin se quite el rol a sí mismo y nadie pueda gestionar usuarios
  if (id === req.usuario!.id) return void res.status(400).json({ error: 'No puedes cambiar tu propio rol' })
  if (!Number.isInteger(id) || !(await prisma.usuario.findUnique({ where: { id } }))) {
    return void res.status(404).json({ error: 'Usuario no encontrado' })
  }
  res.json(await prisma.usuario.update({ where: { id }, data: { rol }, select: usuarioPublico }))
})

adminRouter.delete('/admin/usuarios/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (id === req.usuario!.id) return void res.status(400).json({ error: 'No puedes borrarte a ti mismo' })
  if (!Number.isInteger(id) || !(await prisma.usuario.findUnique({ where: { id } }))) {
    return void res.status(404).json({ error: 'Usuario no encontrado' })
  }
  try {
    await prisma.usuario.delete({ where: { id } }) // sus notas, equipos, votos y propuestas caen en cascada
  } catch (e) {
    // La BD no deja borrar a quien tiene asignaturas, recursos o retos a su nombre (P2003: clave foránea)
    if ((e as { code?: string }).code === 'P2003') {
      return void res.status(409).json({ error: 'Tiene asignaturas, recursos o retos a su nombre: pásalos a otro profesor antes de borrarlo' })
    }
    throw e
  }
  res.status(204).end()
})
