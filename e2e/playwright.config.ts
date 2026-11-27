import { defineConfig } from '@playwright/test'

// Levanta backend y frontend antes de los tests (la BD local tiene que estar arrancada: npm run db:local)
export default defineConfig({
  testDir: 'tests',
  use: { baseURL: 'http://localhost:5173' },
  webServer: [
    { command: 'npm run dev -w backend', cwd: '..', url: 'http://localhost:3000/api/health', reuseExistingServer: true },
    { command: 'npm run dev -w frontend', cwd: '..', url: 'http://localhost:5173', reuseExistingServer: true },
  ],
})
