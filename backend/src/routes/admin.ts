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
