import './style.css'
import { html } from './html'
import { homePage } from './pages/home'
import { notFoundPage } from './pages/not-found'
import { createRouter, type Routes } from './router'

// Rutas de la SPA (ver docs/PLAN.md §7). Cada página es una función que devuelve un HTMLElement.
const routes: Routes = {
  '/': homePage,
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
    <header class="border-b bg-white">
      <nav class="mx-auto flex max-w-5xl gap-4 p-4 text-sm font-medium">
        ${nav.map(([href, label]) => `<a href="${href}" class="hover:text-indigo-600">${label}</a>`).join('')}
      </nav>
    </header>
    <main class="mx-auto max-w-5xl p-4"></main>
  </div>`)
document.querySelector('#app')!.append(layout)

createRouter(routes, notFoundPage, layout.querySelector('main')!).render()
