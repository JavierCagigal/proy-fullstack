import './style.css'
import { api } from './api'
import { esc, html } from './html'
import { adminUsuariosPage } from './pages/admin-usuarios'
import { loginPage, registroPage } from './pages/auth'
import { homePage } from './pages/home'
import { notFoundPage } from './pages/not-found'
import { createRouter, navigate, type Routes } from './router'
import { cargarSesion, setUsuario, usuario } from './session'

// Rutas de la SPA (ver docs/PLAN.md §7). Cada página es una función que devuelve un HTMLElement.
const routes: Routes = {
  '/': homePage,
  '/login': loginPage,
  '/registro': registroPage,
  '/admin/usuarios': adminUsuariosPage,
}

// Sin sesión solo se puede ver esto; con sesión, no tiene sentido volver aquí.
const PUBLICAS = ['/login', '/registro']
const guard = (path: string) => {
  if (!usuario()) return PUBLICAS.includes(path) ? null : '/login'
  return PUBLICAS.includes(path) ? '/' : null
}

const nav: [string, string][] = [
  ['/', 'Inicio'],
  ['/asignaturas', 'Asignaturas'],
  ['/retos', 'Retos'],
  ['/propuestas', 'Propuestas'],
  ['/clase', 'Clase'],
  ['/skills', 'Skills'],
  ['/ofertas', 'Ofertas'],
]

const layout = html(`
  <div class="min-h-screen">
    <header class="border-b bg-white"><nav class="mx-auto flex max-w-5xl flex-wrap items-center gap-4 p-4 text-sm font-medium"></nav></header>
    <main class="mx-auto max-w-5xl p-4"></main>
  </div>`)
document.querySelector('#app')!.append(layout)

// La cabecera depende de la sesión: se vuelve a pintar cada vez que cambia
const header = layout.querySelector('nav')!
function pintarCabecera() {
  const u = usuario()
  const links = u ? [...nav, ...(u.rol === 'admin' ? [['/admin/usuarios', 'Usuarios']] : [])] : []
  header.innerHTML = `
    <a href="/" class="mr-2 font-bold text-indigo-600">DAWHub</a>
    ${links.map(([href, label]) => `<a href="${href}" class="hover:text-indigo-600">${label}</a>`).join('')}
    <span class="ml-auto flex items-center gap-3">
      ${u ? `<span class="text-slate-500">${esc(u.nombre)} · ${u.rol}</span><button data-logout class="text-indigo-600 hover:underline">Salir</button>` : ''}
    </span>`
}
document.addEventListener('sesion', pintarCabecera)

header.addEventListener('click', async (e) => {
  if (!(e.target as Element).closest('[data-logout]')) return
  await api('/auth/logout', { method: 'POST' })
  setUsuario(null)
  navigate('/login')
})

const router = createRouter(routes, notFoundPage, layout.querySelector('main')!, guard)
cargarSesion().then(router.render)
