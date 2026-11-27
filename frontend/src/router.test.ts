import { beforeEach, describe, expect, it } from 'vitest'
import { createRouter, match, navigate } from './router'

const el = (text: string) => Object.assign(document.createElement('p'), { textContent: text })

describe('match', () => {
  const routes = { '/': () => el('home'), '/asignaturas/:id': (p: Record<string, string>) => el(`asig ${p.id}`) }

  it('encaja rutas exactas y con parámetros', () => {
    expect(match(routes, '/')?.params).toEqual({})
    expect(match(routes, '/asignaturas/42')?.params).toEqual({ id: '42' })
  })

  it('devuelve null si no hay ruta', () => {
    expect(match(routes, '/nope')).toBeNull()
    expect(match(routes, '/asignaturas')).toBeNull()
  })
})

describe('createRouter', () => {
  let outlet: HTMLElement
  beforeEach(() => {
    history.replaceState(null, '', '/')
    document.body.innerHTML = '<a href="/b">b</a><main></main>'
    outlet = document.querySelector('main')!
  })

  it('navega con pushState al hacer clic en un enlace, sin recargar', async () => {
    const router = createRouter({ '/': () => el('A'), '/b': () => el('B') }, () => el('404'), outlet)
    await router.render()
    expect(outlet.textContent).toBe('A')

    document.querySelector('a')!.click()
    await new Promise((r) => setTimeout(r))
    expect(location.pathname).toBe('/b')
    expect(outlet.textContent).toBe('B')
  })

  it('la guardia redirige sin dejar la ruta prohibida en el historial', async () => {
    let logueado = false
    const guard = (path: string) => (!logueado && path !== '/login' ? '/login' : null)
    const router = createRouter({ '/': () => el('home'), '/login': () => el('login') }, () => el('404'), outlet, guard)

    const antes = history.length
    await router.navigate('/')
    expect(location.pathname).toBe('/login')
    expect(outlet.textContent).toBe('login')

    logueado = true
    await navigate('/')
    expect(outlet.textContent).toBe('home')
    expect(history.length).toBe(antes + 1)
  })

  it('muestra la página 404 si no hay ruta', async () => {
    const router = createRouter({}, () => el('404'), outlet)
    await router.navigate('/inexistente')
    expect(outlet.textContent).toBe('404')
  })
})
