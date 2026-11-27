import cookieParser from 'cookie-parser'
import express, { type ErrorRequestHandler } from 'express'
import { cargarUsuario } from './auth.js'
import { prisma } from './db.js'
import { adminRouter } from './routes/admin.js'
import { asignaturasRouter } from './routes/asignaturas.js'
import { authRouter } from './routes/auth.js'
import { claseRouter } from './routes/clase.js'
import { comunidadRouter } from './routes/comunidad.js'
import { evaluacionesRouter } from './routes/evaluaciones.js'
import { githubRouter } from './routes/github.js'
import { panelRouter } from './routes/panel.js'
import { retosRouter } from './routes/retos.js'

const app = express()
app.use(express.json())
app.use(cookieParser())
app.use(cargarUsuario)

// Comprueba las 3 capas desde el frontend: front → API → BD
app.get('/api/health', async (_req, res) => {
  const db = await prisma.$queryRaw`SELECT 1`.then(() => true, () => false)
  res.json({ api: true, db })
})

app.use('/api', authRouter, githubRouter, adminRouter, asignaturasRouter, panelRouter, evaluacionesRouter, retosRouter, comunidadRouter, claseRouter)

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' })
})

// Errores siempre en JSON. Los 4xx (p. ej. JSON mal formado) se devuelven tal cual; el resto, sin detalles.
const onError: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err.status >= 400 && err.status < 500) return void res.status(err.status).json({ error: err.message })
  console.error(err)
  res.status(500).json({ error: 'Error interno' })
}
app.use(onError)

export default app
