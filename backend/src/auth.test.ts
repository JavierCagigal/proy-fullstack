import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import app from './app.js'
import { prisma } from './db.js'
import { PASSWORD, usuariosDeTest } from './test-helpers.js'

// Necesita la BD local en marcha. Los usuarios del test se borran al final.
const { email, conSesion, limpiar } = usuariosDeTest('test-auth.dawhub')
beforeAll(limpiar)
afterAll(limpiar)

describe('registro y sesión', () => {
  it('registra como alumno aunque pida otro rol, y la cookie da acceso a /me', async () => {
    const agent = request.agent(app)
    const correo = email('nuevo')
    const res = await agent.post('/api/auth/registro').send({ nombre: 'Nuevo', email: correo.toUpperCase(), password: PASSWORD, rol: 'admin' })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ email: correo, rol: 'alumno' })
    expect(res.body.passwordHash).toBeUndefined()
    expect(res.headers['set-cookie'][0]).toMatch(/^token=.+HttpOnly/)

    const me = await agent.get('/api/me')
    expect(me.body).toMatchObject({ email: correo, rol: 'alumno' })
  })

  it('rechaza datos inválidos y emails repetidos', async () => {
    await request(app).post('/api/auth/registro').send({ nombre: 'X', email: 'no-es-email', password: PASSWORD }).expect(400)
    await request(app).post('/api/auth/registro').send({ nombre: 'X', email: email('corta'), password: '123' }).expect(400)

    const correo = email('repetido')
    await request(app).post('/api/auth/registro').send({ nombre: 'X', email: correo, password: PASSWORD }).expect(201)
    await request(app).post('/api/auth/registro').send({ nombre: 'Y', email: correo, password: PASSWORD }).expect(409)
  })

  it('login falla con contraseña incorrecta o email inexistente, con el mismo mensaje', async () => {
    const { u } = await conSesion('alumno')
    const mal = await request(app).post('/api/auth/login').send({ email: u.email, password: 'otra-cosa' })
    const noExiste = await request(app).post('/api/auth/login').send({ email: email('nadie'), password: PASSWORD })
    expect(mal.status).toBe(401)
    expect(noExiste.status).toBe(401)
    expect(mal.body.error).toBe(noExiste.body.error)
  })

  it('/me da 401 sin sesión, con un token falso y tras el logout', async () => {
    await request(app).get('/api/me').expect(401)
    await request(app).get('/api/me').set('Cookie', 'token=falso').expect(401)

    const { agent } = await conSesion('alumno')
    await agent.get('/api/me').expect(200)
    await agent.post('/api/auth/logout').expect(204)
    await agent.get('/api/me').expect(401)
  })
})

describe('admin de usuarios (requireRol)', () => {
  it('solo el admin lista usuarios', async () => {
    await request(app).get('/api/admin/usuarios').expect(401)
    await (await conSesion('alumno')).agent.get('/api/admin/usuarios').expect(403)
    await (await conSesion('profesor')).agent.get('/api/admin/usuarios').expect(403)

    const res = await (await conSesion('admin')).agent.get('/api/admin/usuarios').expect(200)
    expect(res.body.length).toBeGreaterThan(0)
    expect(res.body[0].passwordHash).toBeUndefined()
  })

  it('el admin cambia roles, y el cambio se aplica sin volver a iniciar sesión', async () => {
    const { agent: admin, u: yo } = await conSesion('admin')
    const { agent: alumno, u } = await conSesion('alumno')

    await admin.patch(`/api/admin/usuarios/${u.id}`).send({ rol: 'superjefe' }).expect(400)
    await admin.patch(`/api/admin/usuarios/${yo.id}`).send({ rol: 'alumno' }).expect(400)
    await admin.patch('/api/admin/usuarios/999999999').send({ rol: 'profesor' }).expect(404)

    const res = await admin.patch(`/api/admin/usuarios/${u.id}`).send({ rol: 'profesor' }).expect(200)
    expect(res.body.rol).toBe('profesor')
    expect((await alumno.get('/api/me')).body.rol).toBe('profesor')
  })

  it('el admin borra usuarios, pero no a sí mismo ni a quien tiene asignaturas', async () => {
    const { agent: admin, u: yo } = await conSesion('admin')
    const { agent: alumno, u } = await conSesion('alumno')
    const { u: profe } = await conSesion('profesor')
    await prisma.asignatura.create({ data: { nombre: 'De test', curso: '1º', profesorId: profe.id } })

    await alumno.delete(`/api/admin/usuarios/${u.id}`).expect(403)
    await admin.delete(`/api/admin/usuarios/${yo.id}`).expect(400)
    await admin.delete(`/api/admin/usuarios/${profe.id}`).expect(409)
    await admin.delete(`/api/admin/usuarios/${u.id}`).expect(204)
    await alumno.get('/api/me').expect(401) // su sesión ya no vale
  })
})

describe('errores', () => {
  it('responde en JSON a rutas inexistentes y a JSON mal formado', async () => {
    const r404 = await request(app).get('/api/no-existe')
    expect(r404.status).toBe(404)
    expect(r404.body.error).toBeTruthy()

    const r400 = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{mal')
    expect(r400.status).toBe(400)
    expect(r400.body.error).toBeTruthy()
  })
})
