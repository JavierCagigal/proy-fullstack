import { api } from '../api'
import { esc, html } from '../html'
import { navigate } from '../router'
import { usuario, type Usuario } from '../session'
import { icono, pegatina } from '../ui'

type Asignatura = { id: number; nombre: string; curso: string; profesor: { id: number; nombre: string }; _count: { temas: number } }

export async function asignaturasPage() {
  const u = usuario()!
  const puedeCrear = u.rol !== 'alumno'
  // El admin elige el profesor de la asignatura; el profesor la crea a su nombre
  const [asignaturas, profesores] = await Promise.all([
    api<Asignatura[]>('/asignaturas'),
    u.rol === 'admin' ? api<Usuario[]>('/admin/usuarios').then((us) => us.filter((x) => x.rol !== 'alumno')) : Promise.resolve([]),
  ])

  const el = html(`
    <div class="space-y-8">
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="font-display text-4xl font-extrabold tracking-tight">Asignaturas</h1>
          <p class="mt-2 text-lg text-muted">${asignaturas.length === 1 ? '1 asignatura' : `${asignaturas.length} asignaturas`} en Commit.</p>
        </div>
        ${puedeCrear ? `<button data-abrir class="btn btn-primario" aria-expanded="false" aria-controls="nueva">${icono('mas')}Nueva asignatura</button>` : ''}
      </header>

      ${puedeCrear ? `
        <form id="nueva" hidden class="panel grid gap-4 p-6 sm:grid-cols-2 ${profesores.length ? 'lg:grid-cols-[2fr_1fr_1fr_auto]' : 'lg:grid-cols-[2fr_1fr_auto]'} lg:items-end">
          <label class="block font-semibold">Nombre<input name="nombre" required class="campo" placeholder="Desarrollo Web en Entorno Cliente"></label>
          <label class="block font-semibold">Curso<input name="curso" required class="campo" placeholder="2º DAW"></label>
          ${profesores.length ? `
            <label class="block font-semibold">Profesor
              <select name="profesorId" class="campo">${profesores.map((p) => `<option value="${p.id}" ${p.id === u.id ? 'selected' : ''}>${esc(p.nombre)}</option>`).join('')}</select>
            </label>` : ''}
          <button class="btn btn-primario">Crear</button>
          <p data-error role="alert" class="text-sm font-medium text-danger sm:col-span-full empty:hidden"></p>
        </form>` : ''}

      ${asignaturas.length ? `
        <ul class="panel divide-y divide-line">
          ${asignaturas.map((a) => `
            <li>
              <a href="/asignaturas/${a.id}" class="group flex items-center gap-6 px-6 py-5 hover:bg-[#f7f8fa]">
                <span class="w-24 shrink-0">${pegatina(a)}</span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-lg font-semibold group-hover:underline">${esc(a.nombre)}</span>
                  <span class="block text-muted">${esc(a.curso)} · ${esc(a.profesor.nombre)}</span>
                </span>
                <span class="hidden text-muted sm:block">${a._count.temas === 1 ? '1 tema' : `${a._count.temas} temas`}</span>
                <span class="text-muted transition-transform group-hover:translate-x-1">${icono('flecha')}</span>
              </a>
            </li>`).join('')}
        </ul>` : `<p class="panel p-6 text-muted">${puedeCrear ? 'Todavía no hay asignaturas. Crea la primera.' : 'Todavía no hay asignaturas. Tu profesor las creará pronto.'}</p>`}
    </div>`)

  const form = el.querySelector<HTMLFormElement>('#nueva')
  const abrir = el.querySelector<HTMLButtonElement>('[data-abrir]')
  abrir?.addEventListener('click', () => {
    form!.hidden = !form!.hidden
    abrir.setAttribute('aria-expanded', String(!form!.hidden))
    if (!form!.hidden) form!.querySelector('input')!.focus()
  })
  form?.addEventListener('submit', async (e) => {
    e.preventDefault()
    try {
      const nueva = await api<{ id: number }>('/asignaturas', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(form))) })
      navigate(`/asignaturas/${nueva.id}`)
    } catch (err) {
      form.querySelector('[data-error]')!.textContent = (err as Error).message
    }
  })
  return el
}
