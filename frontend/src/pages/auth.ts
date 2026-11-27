import { api } from '../api'
import { html } from '../html'
import { navigate } from '../router'
import { setUsuario, type Usuario } from '../session'

const input = 'mt-1 block w-full rounded border border-slate-300 px-3 py-2'

/** Formulario de login o registro: envía los campos a la API y, si va bien, entra en la app. */
function authForm(titulo: string, endpoint: string, campos: string, pie: string) {
  const el = html(`
    <section class="mx-auto max-w-sm space-y-4 pt-8">
      <h1 class="text-2xl font-bold">${titulo}</h1>
      <form class="space-y-3">
        ${campos}
        <p data-error role="alert" class="text-sm text-red-600"></p>
        <button class="w-full rounded bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50">${titulo}</button>
      </form>
      <p class="text-sm text-slate-600">${pie}</p>
    </section>`)
  const form = el.querySelector('form')!
  const error = el.querySelector<HTMLElement>('[data-error]')!
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    form.querySelector('button')!.disabled = true
    try {
      const body = JSON.stringify(Object.fromEntries(new FormData(form)))
      setUsuario(await api<Usuario>(endpoint, { method: 'POST', body }))
      navigate('/')
    } catch (err) {
      error.textContent = (err as Error).message
      form.querySelector('button')!.disabled = false
    }
  })
  return el
}

const email = `<label class="block text-sm font-medium">Email<input name="email" type="email" required autocomplete="email" class="${input}"></label>`

export const loginPage = () =>
  authForm(
    'Entrar',
    '/auth/login',
    `${email}
     <label class="block text-sm font-medium">Contraseña<input name="password" type="password" required autocomplete="current-password" class="${input}"></label>`,
    '¿No tienes cuenta? <a href="/registro" class="text-indigo-600 underline">Regístrate</a>',
  )

export const registroPage = () =>
  authForm(
    'Crear cuenta',
    '/auth/registro',
    `<label class="block text-sm font-medium">Nombre<input name="nombre" required autocomplete="name" class="${input}"></label>
     ${email}
     <label class="block text-sm font-medium">Contraseña<input name="password" type="password" required minlength="8" maxlength="72" autocomplete="new-password" class="${input}"></label>`,
    '¿Ya tienes cuenta? <a href="/login" class="text-indigo-600 underline">Entra</a>',
  )
