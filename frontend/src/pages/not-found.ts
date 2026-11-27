import { html } from '../html'
import { usuario } from '../session'

export const notFoundPage = () =>
  html(`
    <section class="${usuario() ? '' : 'p-8 '}flex flex-col items-start gap-6 py-10">
      <span class="sticker -rotate-6 bg-tomato px-6 py-4 text-6xl">404</span>
      <div>
        <h1 class="font-display text-3xl font-extrabold">Esta página no existe</h1>
        <p class="mt-2 text-lg text-muted">Puede que el enlace esté mal o que la página todavía no esté hecha.</p>
      </div>
      <a href="/" class="btn btn-primario">Volver a Hoy</a>
    </section>`)
