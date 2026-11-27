import request from 'supertest'
import { describe, expect, it } from 'vitest'
import app from './app'

describe('GET /api/health', () => {
  it('responde aunque la BD no esté disponible', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.api).toBe(true)
    expect(typeof res.body.db).toBe('boolean')
  })
})
