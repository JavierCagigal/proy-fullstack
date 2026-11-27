import { api } from '../api'
import { html } from '../html'
import { navigate } from '../router'
import { setUsuario, type Usuario } from '../session'

// La tapa del portátil: pegatinas de la clase (decorativas, aria-hidden)
const TAPA = [
  ['DWEC', 'tomato', 'left-[8%] top-[14%] -rotate-6'],
  ['Hackathon', 'lemon', 'left-[46%] top-[9%] rotate-3'],
  ['TypeScript', 'sky', 'left-[20%] top-[30%] rotate-2'],
  ['git push', 'mint', 'left-[58%] top-[27%] -rotate-3'],
  ['DIW', 'pink', 'left-[62%] top-[58%] rotate-6'],
  ['Express', 'lilac', 'left-[14%] top-[62%] -rotate-2'],
]

/** Formulario de login o registro: envía los campos a la API y, si va bien, entra en la app. */
function authPage(titulo: string, boton: string, endpoint: string, campos: string, pie: string) {
  const el = html(`
    <div class="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <section class="relative overflow-hidden bg-rail px-6 py-8 text-white lg:px-14 lg:py-14">
        <span class="sticker -rotate-3 bg-lemon px-4 py-2.5 text-3xl">commit</span>
        <p class="mt-8 max-w-md font-display text-3xl font-extrabold leading-tight lg:text-5xl">Tu clase, en un solo sitio.</p>
        <p class="mt-4 max-w-sm text-rail-text">Apuntes, notas, retos y proyectos de informática. Hecho por y para gente que programa.</p>
        <div aria-hidden="true" class="relative mt-10 hidden h-[46vh] rounded-3xl bg-[#c7ccd3] lg:block">
          ${TAPA.map(([t, c, pos]) => `<span class="sticker absolute ${pos} px-4 py-3 text-xl" style="background:var(--color-${c})">${t}</span>`).join('')}
        </div>
      </section>
      <section class="flex items-center justify-center px-6 py-12">
        <div class="w-full max-w-sm">
          <h1 class="font-display text-4xl font-extrabold tracking-tight">${titulo}</h1>
          <form class="mt-8 space-y-4" novalidate>
            ${campos}
            <p data-error role="alert" class="min-h-5 text-sm font-medium text-danger"></p>
            <button class="btn btn-primario w-full py-3 text-base">${boton}</button>
          </form>
          <p class="mt-6 text-muted">${pie}</p>
        </div>
      </section>
    </div>`)

  const form = el.querySelector('form')!
  const error = el.querySelector<HTMLElement>('[data-error]')!
  const enviar = form.querySelector('button')!
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (!form.reportValidity()) return
    enviar.disabled = true
    enviar.textContent = 'Un momento…'
    try {
      const body = JSON.stringify(Object.fromEntries(new FormData(form)))
      setUsuario(await api<Usuario>(endpoint, { method: 'POST', body }))
      navigate('/')
    } catch (err) {
      error.textContent = (err as Error).message
      enviar.disabled = false
      enviar.textContent = boton
    }
  })
  return el
}

const campo = (label: string, attrs: string) =>
  `<label class="block font-semibold">${label}<input class="campo" ${attrs}></label>`

export const loginPage = () =>
  authPage(
    'Hola de nuevo',
    'Entrar',
    '/auth/login',
    campo('Email', 'name="email" type="email" required autocomplete="email"') +
      campo('Contraseña', 'name="password" type="password" required autocomplete="current-password"'),
    '¿Aún no tienes cuenta? <a href="/registro" class="font-semibold text-ink underline">Regístrate</a>',
  )

export const registroPage = () =>
  authPage(
    'Crea tu cuenta',
    'Crear cuenta',
    '/auth/registro',
    campo('Nombre', 'name="nombre" required autocomplete="name"') +
      campo('Email', 'name="email" type="email" required autocomplete="email"') +
      campo('Contraseña', 'name="password" type="password" required minlength="8" maxlength="72" autocomplete="new-password" aria-describedby="pista"') +
      '<p id="pista" class="-mt-2 text-sm text-muted">Mínimo 8 caracteres.</p>',
    '¿Ya tienes cuenta? <a href="/login" class="font-semibold text-ink underline">Entra</a>',
  )
