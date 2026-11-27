import '@fontsource-variable/figtree'
import '@fontsource-variable/bricolage-grotesque/opsz.css'
import './style.css'
import { api } from './api'
import { esc, html } from './html'
import { adminUsuariosPage } from './pages/admin-usuarios'
import { asignaturaPage } from './pages/asignatura'
import { asignaturasPage } from './pages/asignaturas'
import { calendarioPage } from './pages/calendario'
import { ofertasPage, propuestasPage } from './pages/comunidad'
import { loginPage, registroPage } from './pages/auth'
import { homePage } from './pages/home'
import { notFoundPage } from './pages/not-found'
import { notasPage } from './pages/notas'
import { retoPage, retosPage } from './pages/retos'
import { createRouter, navigate, type Routes } from './router'
import { cargarSesion, setUsuario, usuario } from './session'
import { icono, type Icono } from './ui'

// Rutas de la SPA (ver docs/PLAN.md §7). Cada página es una función que devuelve un HTMLElement.
const routes: Routes = {
  '/': homePage,
  '/login': loginPage,
  '/registro': registroPage,
  '/asignaturas': asignaturasPage,
  '/asignaturas/:id': asignaturaPage,
  '/calendario': calendarioPage,
  '/notas': notasPage,
  '/retos': retosPage,
  '/retos/:id': retoPage,
  '/propuestas': propuestasPage,
  '/ofertas': ofertasPage,
  '/admin/usuarios': adminUsuariosPage,
}

// Sin sesión solo se puede ver esto; con sesión, no tiene sentido volver aquí.
const PUBLICAS = ['/login', '/registro']
const guard = (path: string) => {
  if (!usuario()) return PUBLICAS.includes(path) ? null : '/login'
  return PUBLICAS.includes(path) ? '/' : null
}

// Solo lo que ya existe: cada bloque añade aquí su página cuando la termina.
const NAV: [string, string, Icono][] = [
  ['/', 'Hoy', 'hoy'],
  ['/asignaturas', 'Asignaturas', 'asignaturas'],
  ['/calendario', 'Calendario', 'calendario'],
  ['/notas', 'Notas', 'notas'],
  ['/retos', 'Retos', 'retos'],
  ['/propuestas', 'Propuestas', 'propuestas'],
  ['/ofertas', 'Ofertas', 'ofertas'],
]

const ROL = { admin: 'admin', profesor: 'profesor', alumno: 'alumno' }

const layout = html(`
  <div class="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
    <nav data-rail aria-label="Principal" class="bg-rail text-rail-text lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col"></nav>
    <main></main>
  </div>`)
document.querySelector('#app')!.append(layout)
const rail = layout.querySelector<HTMLElement>('[data-rail]')!
const main = layout.querySelector('main')!

// El rail depende de la sesión: se vuelve a pintar cada vez que cambia
function pintarRail() {
  const u = usuario()
  rail.hidden = !u
  // Sin sesión (login y registro) la página ocupa toda la pantalla
  layout.classList.toggle('lg:grid', !!u)
  main.className = u ? 'mx-auto w-full max-w-6xl px-5 py-8 lg:px-10 lg:py-10' : ''
  if (!u) return
  const links = [...NAV, ...(u.rol === 'admin' ? [['/admin/usuarios', 'Usuarios', 'usuarios'] as [string, string, Icono]] : [])]
  rail.innerHTML = `
    <div class="flex items-center gap-3 px-4 py-3 lg:block lg:px-4 lg:pt-6">
      <a href="/" aria-label="Commit, ir a Hoy" class="sticker -rotate-3 shrink-0 bg-lemon px-3 py-1.5 text-lg lg:ml-1 lg:px-3.5 lg:py-2 lg:text-xl">commit</a>
      <ul class="flex min-w-0 gap-1 overflow-x-auto lg:mt-8 lg:flex-col">
        ${links.map(([href, label, ico]) => `
          <li><a href="${href}" data-nav class="flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 font-medium transition-colors hover:bg-rail-2 hover:text-white aria-[current=page]:bg-rail-2 aria-[current=page]:text-white">${icono(ico, 'hidden size-[18px] lg:block')}${label}</a></li>`).join('')}
      </ul>
      <button data-logout class="ml-auto shrink-0 rounded-lg p-2 text-rail-text hover:bg-rail-2 hover:text-white lg:hidden" aria-label="Salir">${icono('salir')}</button>
    </div>
    <div class="hidden border-t border-rail-2 p-4 lg:mt-auto lg:block">
      <div class="flex items-center gap-3">
        <span aria-hidden="true" class="grid size-9 shrink-0 place-items-center rounded-full bg-mint font-display font-extrabold text-ink">${esc(u.nombre[0]?.toUpperCase())}</span>
        <div class="min-w-0 flex-1">
          <p class="truncate font-semibold text-white">${esc(u.nombre)}</p>
          <p class="text-sm text-rail-muted">${ROL[u.rol]}</p>
        </div>
        <button data-logout class="rounded-lg p-2 text-rail-muted hover:bg-rail-2 hover:text-white" aria-label="Salir">${icono('salir')}</button>
      </div>
      <p data-salud class="mt-4 flex items-center gap-2 text-xs text-rail-muted"><span class="size-2 rounded-full bg-rail-muted"></span>Comprobando conexión…</p>
    </div>
`
  marcarActivo()
  comprobarSalud()
}

function marcarActivo() {
  for (const a of rail.querySelectorAll<HTMLAnchorElement>('[data-nav]')) {
    const activo = a.pathname === '/' ? location.pathname === '/' : location.pathname.startsWith(a.pathname)
    if (activo) a.setAttribute('aria-current', 'page')
    else a.removeAttribute('aria-current')
  }
}

// Front → API → BD: el punto verde demuestra que las tres capas están conectadas
function comprobarSalud() {
  const p = rail.querySelector<HTMLElement>('[data-salud]')!
  api<{ db: boolean }>('/health').then(
    (h) => (p.innerHTML = h.db ? '<span class="size-2 rounded-full bg-mint"></span>API y BD conectadas' : '<span class="size-2 rounded-full bg-tomato"></span>La BD no responde'),
    () => (p.innerHTML = '<span class="size-2 rounded-full bg-tomato"></span>La API no responde'),
  )
}

document.addEventListener('sesion', pintarRail)
window.addEventListener('ruta', marcarActivo)

rail.addEventListener('click', async (e) => {
  if (!(e.target as Element).closest('[data-logout]')) return
  await api('/auth/logout', { method: 'POST' })
  setUsuario(null)
  navigate('/login')
})

const router = createRouter(routes, notFoundPage, main, guard)
cargarSesion().then(router.render)
