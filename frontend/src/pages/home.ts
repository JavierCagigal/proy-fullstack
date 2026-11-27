import { api } from '../api'
import { html } from '../html'

export function homePage() {
  const el = html(`
    <section class="space-y-4">
      <h1 class="text-3xl font-bold">DAWHub</h1>
      <p class="text-slate-600">Portal de clase para profesores y alumnos de informática.</p>
      <p data-health class="text-sm text-slate-500">Comprobando la API…</p>
    </section>`)
  const health = el.querySelector<HTMLElement>('[data-health]')!
  api<{ api: boolean; db: boolean }>('/health').then(
    (h) => (health.textContent = `API ✅ · BD ${h.db ? '✅' : '❌'}`),
    () => (health.textContent = 'API ❌ (¿está arrancado el backend?)'),
  )
  return el
}
