// La clase: perfiles de alumnos y profesores con su GitHub y sus proyectos (docs/PLAN.md §1 y §7).
import { Router } from 'express'
import { requireRol, usuarioPublico } from '../auth.js'
import { prisma } from '../db.js'
import { idDe, texto } from '../validar.js'

export const claseRouter = Router()
claseRouter.use('/clase', requireRol())

// Lo que se enseña de cada persona (nunca el email ni el hash)
const perfil = { id: true, nombre: true, rol: true, githubUsername: true, avatarUrl: true, bio: true } as const

claseRouter.get('/clase', async (_req, res) => {
  const personas = await prisma.usuario.findMany({
    where: { rol: { not: 'admin' } },
    orderBy: [{ rol: 'desc' }, { nombre: 'asc' }], // profesor antes que alumno
    select: {
      ...perfil,
      miembroDe: { select: { equipo: { select: { reto: { select: { titulo: true } } } } } },
      propuestas: { select: { tecnologias: true } },
      asignaturas: { orderBy: { nombre: 'asc' }, select: { id: true, nombre: true } }, // las que imparte un profesor
    },
  })
  // Las pegatinas de "su portátil": los retos en los que ha participado y las tecnologías de sus propuestas
  res.json(personas.map(({ miembroDe, propuestas, ...p }) => ({
    ...p,
    retos: miembroDe.map((m) => m.equipo.reto.titulo),
    tecnologias: [...new Set(propuestas.flatMap((x) => x.tecnologias))],
  })))
})

claseRouter.get('/clase/:id', async (req, res) => {
  const u = await prisma.usuario.findUnique({
    where: { id: idDe(req.params.id) },
    select: {
      ...perfil,
      miembroDe: {
        select: {
          equipo: {
            select: {
              nombre: true, repoUrl: true, demoUrl: true, entregadoEn: true,
              reto: { select: { id: true, titulo: true, fin: true } },
            },
          },
        },
      },
      propuestas: { orderBy: { creadoEn: 'desc' }, select: { id: true, titulo: true, tecnologias: true, estado: true } },
      asignaturas: { orderBy: { nombre: 'asc' }, select: { id: true, nombre: true } },
    },
  })
  if (!u || u.rol === 'admin') return void res.status(404).json({ error: 'No existe' })
  const { miembroDe, ...resto } = u
  res.json({ ...resto, equipos: miembroDe.map((m) => m.equipo) })
})

/** Cada uno edita su propio perfil: nombre, usuario de GitHub y bio. */
claseRouter.patch('/me', requireRol(), async (req, res) => {
  const nombre = texto(req.body?.nombre)
  const githubUsername = texto(req.body?.githubUsername).replace(/^@/, '')
  const bio = texto(req.body?.bio)
  if (!nombre) return void res.status(400).json({ error: 'Pon tu nombre' })
  // Formato de GitHub: letras, números y guiones, hasta 39 caracteres
  if (githubUsername && !/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(githubUsername)) {
    return void res.status(400).json({ error: 'Ese usuario de GitHub no es válido' })
  }
  if (bio.length > 280) return void res.status(400).json({ error: 'La bio tiene un máximo de 280 caracteres' })
  res.json(await prisma.usuario.update({
    where: { id: req.usuario!.id },
    data: { nombre, githubUsername: githubUsername || null, bio: bio || null },
    select: usuarioPublico,
  }))
})
