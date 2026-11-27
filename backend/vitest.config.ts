import { existsSync } from 'node:fs'
import { defineConfig } from 'vitest/config'

// Los tests de la API usan la BD local (npm run db:local) y el JWT_SECRET del .env
if (existsSync('.env')) process.loadEnvFile('.env')

// Los archivos comparten la BD local (prisma dev no aguanta bien conexiones en paralelo): uno tras otro.
export default defineConfig({ test: { fileParallelism: false } })
