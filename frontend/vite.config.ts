/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [tailwindcss()],
  // En local, /api va al backend (en producción lo hace el rewrite de vercel.json)
  server: { proxy: { '/api': 'http://localhost:3000' } },
  test: { environment: 'jsdom' },
})
