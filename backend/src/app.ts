import cookieParser from 'cookie-parser'
import express from 'express'
import { prisma } from './db.js'

const app = express()
app.use(express.json())
app.use(cookieParser())

// Comprueba las 3 capas desde el frontend: front → API → BD
app.get('/api/health', async (_req, res) => {
  const db = await prisma.$queryRaw`SELECT 1`.then(() => true, () => false)
  res.json({ api: true, db })
})

export default app
