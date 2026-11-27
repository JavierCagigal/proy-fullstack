// Datos de demo. Contraseña de todos los usuarios: SEED_PASSWORD, o dawhub123 en local.
// En producción (repo público) usa otra: SEED_PASSWORD='...' npx prisma db seed
import { hash } from 'bcryptjs'
import { prisma } from '../src/db.js'

const TIPOS_MD = `## Tipos primitivos

TypeScript añade **tipos** a JavaScript. Los básicos son \`string\`, \`number\` y \`boolean\`.

\`\`\`ts
const nombre: string = 'Lucía'
let intentos: number = 0
\`\`\`

- Usa \`unknown\` en vez de \`any\` cuando no sepas el tipo.
- Deja que TypeScript **infiera** siempre que puedas.

Más en la [documentación oficial](https://www.typescriptlang.org/docs/).`

const day = (n: number) => new Date(Date.now() + n * 86_400_000)

async function main() {
  // Vacía todo en orden inverso a las FK (las relaciones con cascade arrastran el resto)
  await prisma.oferta.deleteMany()
  await prisma.propuesta.deleteMany()
  await prisma.reto.deleteMany()
  await prisma.asignatura.deleteMany()
  await prisma.recurso.deleteMany()
  await prisma.usuario.deleteMany()

  const password = process.env.SEED_PASSWORD ?? 'dawhub123'
  const passwordHash = await hash(password, 10)
  const u = (nombre: string, email: string, rol: 'admin' | 'profesor' | 'alumno', githubUsername?: string) =>
    prisma.usuario.create({ data: { nombre, email, rol, passwordHash, githubUsername } })

  await u('Admin', 'admin@dawhub.dev', 'admin')
  const ana = await u('Ana Profesora', 'ana@dawhub.dev', 'profesor')
  const luis = await u('Luis Profesor', 'luis@dawhub.dev', 'profesor')
  const alumnos = await Promise.all(
    ['Lucía', 'Pablo', 'Marta', 'Diego', 'Sara', 'Hugo'].map((n) =>
      u(n, `${n.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')}@dawhub.dev`, 'alumno', `${n.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')}-dev`),
    ),
  )

  const dwec = await prisma.asignatura.create({
    data: {
      nombre: 'Desarrollo Web en Entorno Cliente', curso: '2º DAW', profesorId: ana.id,
      temas: {
        create: [
          {
            titulo: 'TypeScript y el DOM', orden: 1,
            recursos: {
              create: [
                { tipo: 'apunte', titulo: 'Tipos básicos', contenidoMd: TIPOS_MD, visible: true, autorId: ana.id },
                { tipo: 'video', titulo: 'Manipular el DOM', url: 'https://developer.mozilla.org/es/docs/Web/API/Document_Object_Model', visible: true, autorId: ana.id },
                { tipo: 'apunte', titulo: 'Solución del examen (oculto)', contenidoMd: '# Solución', visible: false, autorId: ana.id },
              ],
            },
          },
          {
            titulo: 'SPA y History API', orden: 2,
            recursos: {
              create: [{ tipo: 'apunte', titulo: 'Router propio', contenidoMd: '# pushState y popstate', visible: true, visibleDesde: day(3), autorId: ana.id }],
            },
          },
        ],
      },
      evaluaciones: { create: [{ titulo: 'Examen T1', tipo: 'examen', fecha: day(-10) }, { titulo: 'Examen T2 · TypeScript y el DOM', tipo: 'examen', fecha: day(3) }, { titulo: 'Práctica SPA', tipo: 'practica', fecha: day(7) }] },
    },
    include: { evaluaciones: true },
  })

  await prisma.asignatura.create({
    data: {
      nombre: 'Desarrollo Web en Entorno Servidor', curso: '2º DAW', profesorId: luis.id,
      temas: { create: [{ titulo: 'APIs REST con Express', orden: 1, recursos: { create: [{ tipo: 'enlace', titulo: 'Guía de Express', url: 'https://expressjs.com/es/', visible: true, autorId: luis.id }] } }] },
      evaluaciones: { create: [{ titulo: 'Examen API REST', tipo: 'examen', fecha: day(14) }] },
    },
  })

  await prisma.asignatura.create({
    data: {
      nombre: 'Despliegue de Aplicaciones Web', curso: '2º DAW', profesorId: luis.id,
      temas: {
        create: [
          { titulo: 'Servidores web y HTTP', orden: 1, recursos: { create: [
            { tipo: 'apunte', titulo: 'Qué pasa cuando escribes una URL', contenidoMd: '## DNS, TCP y TLS\n\n1. El navegador resuelve el **dominio**.\n2. Abre una conexión TCP y negocia TLS.\n3. Envía `GET /` y pinta la respuesta.', visible: true, autorId: luis.id },
            { tipo: 'video', titulo: 'HTTP en 10 minutos', url: 'https://developer.mozilla.org/es/docs/Web/HTTP/Overview', visible: true, autorId: luis.id },
          ] } },
          { titulo: 'Despliegue continuo', orden: 2, recursos: { create: [
            { tipo: 'enlace', titulo: 'Documentación de Vercel', url: 'https://vercel.com/docs', visible: true, autorId: luis.id },
            { tipo: 'proyecto', titulo: 'Práctica: despliega tu API', contenidoMd: 'Despliega una API Express en Vercel con su BD en Supabase. Entrega la URL y el repo.', visible: true, visibleDesde: day(2), autorId: luis.id },
          ] } },
        ],
      },
      evaluaciones: { create: [{ titulo: 'Proyecto · Despliegue en Vercel', tipo: 'proyecto', fecha: day(15) }] },
    },
  })

  await prisma.asignatura.create({
    data: {
      nombre: 'Diseño de Interfaces Web', curso: '2º DAW', profesorId: ana.id,
      temas: { create: [
        { titulo: 'Color, tipografía y contraste', orden: 1, recursos: { create: [
          { tipo: 'apunte', titulo: 'Contraste accesible (WCAG AA)', contenidoMd: '## La regla\n\nTexto normal: contraste de **4,5:1**. Texto grande: **3:1**.\n\nComprueba tus colores antes de entregar.', visible: true, autorId: ana.id },
          { tipo: 'enlace', titulo: 'Comprobador de contraste', url: 'https://webaim.org/resources/contrastchecker/', visible: true, autorId: ana.id },
        ] } },
      ] },
    },
  })

  await prisma.asignatura.create({
    data: { nombre: 'Empresa e Iniciativa Emprendedora', curso: '2º DAW', profesorId: luis.id, temas: { create: [{ titulo: 'La idea de negocio', orden: 1 }] } },
  })

  await prisma.nota.createMany({
    data: alumnos.map((a, i) => ({ evaluacionId: dwec.evaluaciones[0].id, alumnoId: a.id, nota: 5 + i * 0.8 })),
  })

  await prisma.recurso.createMany({
    data: [
      { tipo: 'skill', categoria: 'frontend', titulo: 'roadmap.sh Frontend', url: 'https://roadmap.sh/frontend', visible: true, autorId: ana.id },
      { tipo: 'skill', categoria: 'devops', titulo: 'Docker para principiantes', url: 'https://docs.docker.com/get-started/', visible: true, autorId: luis.id },
    ],
  })

  const reto = await prisma.reto.create({
    data: {
      titulo: 'Hackathon: app para tu barrio', descripcionMd: 'Construid en 48 h una app útil para vuestro barrio.',
      inicio: day(-1), fin: day(1), maxMiembros: 3, asignaturaId: dwec.id, creadoPorId: ana.id,
      equipos: { create: [{ nombre: 'Los Commits' }, { nombre: 'Null Pointers' }] },
    },
    include: { equipos: true },
  })
  await prisma.equipoMiembro.createMany({
    data: alumnos.map((a, i) => ({ equipoId: reto.equipos[i % 2].id, retoId: reto.id, usuarioId: a.id })),
  })

  await prisma.propuesta.create({
    data: {
      titulo: 'Bot de Discord para dudas de clase', descripcionMd: 'Un bot que responda dudas frecuentes.',
      tecnologias: ['Node', 'discord.js'], autorId: alumnos[0].id,
      interesados: { create: [{ usuarioId: alumnos[1].id }, { usuarioId: alumnos[2].id }] },
    },
  })

  await prisma.oferta.createMany({
    data: [
      { titulo: 'Prácticas Frontend', empresa: 'Acme Tech', url: 'https://example.com/oferta-1', ubicacion: 'Madrid (híbrido)', tipo: 'practicas', autorId: alumnos[3].id, aprobada: true },
      { titulo: 'Junior Fullstack', empresa: 'Startup X', url: 'https://example.com/oferta-2', tipo: 'empleo', autorId: alumnos[4].id },
    ],
  })

  console.log(`Seed OK. Usuarios: admin@dawhub.dev, ana@dawhub.dev, lucia@dawhub.dev… (contraseña: ${process.env.SEED_PASSWORD ? 'la de SEED_PASSWORD' : password})`)
}

main().finally(() => prisma.$disconnect())
