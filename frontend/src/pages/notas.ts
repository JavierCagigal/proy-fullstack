import { api } from '../api'
import { esc, html } from '../html'
import { usuario } from '../session'
import { confirmado, fechaCorta, fechaLocal, icono, nota, pegatina } from '../ui'

type Tipo = 'examen' | 'practica' | 'proyecto'
type Evaluacion = { id: number; titulo: string; tipo: Tipo; fecha: string; peso: number }
const TIPO: Record<Tipo, string> = { examen: 'Examen', practica: 'Práctica', proyecto: 'Proyecto' }

/** Media ponderada de las notas puestas (la misma regla que el backend). */
function media(items: { nota: number | null; peso: number }[]) {
  const puestas = items.filter((i) => i.nota !== null)
  const pesos = puestas.reduce((s, i) => s + i.peso, 0)
  return pesos ? puestas.reduce((s, i) => s + i.nota! * i.peso, 0) / pesos : null
}

export const notasPage = () => (usuario()!.rol === 'alumno' ? misNotas() : cuaderno())

// ── Alumno: sus notas ──────────────────────────────────────────────────────

type MisNotas = { id: number; nombre: string; media: number | null; evaluaciones: (Evaluacion & { nota: number | null; comentario: string | null })[] }[]

async function misNotas() {
  const asignaturas = await api<MisNotas>('/notas')
  return html(`
    <div class="space-y-8">
      <header>
        <h1 class="font-display text-4xl font-extrabold tracking-tight">Mis notas</h1>
        <p class="mt-2 text-lg text-muted">Solo tú ves estas notas. La media pondera cada evaluación por su peso.</p>
      </header>
      ${asignaturas.length ? asignaturas.map((a) => `
        <section class="panel p-6" aria-labelledby="asig-${a.id}">
          <div class="flex flex-wrap items-center gap-x-5 gap-y-3">
            ${pegatina(a)}
            <h2 id="asig-${a.id}" class="min-w-0 flex-1 font-display text-xl font-extrabold">${esc(a.nombre)}</h2>
            <p class="text-muted">Media <b class="tabular ml-1 font-display text-2xl font-extrabold text-ink">${a.media === null ? '—' : nota(a.media)}</b></p>
          </div>
          <div class="mt-4 overflow-x-auto">
            <table class="w-full text-left">
              <thead class="text-sm text-muted"><tr><th class="py-2 pr-4 font-semibold">Evaluación</th><th class="py-2 pr-4 font-semibold">Fecha</th><th class="py-2 pr-4 font-semibold">Peso</th><th class="py-2 text-right font-semibold">Nota</th></tr></thead>
              <tbody>
                ${a.evaluaciones.map((e) => `
                  <tr class="border-t border-line align-top">
                    <td class="py-3 pr-4"><span class="font-semibold">${esc(e.titulo)}</span> <span class="text-muted">· ${TIPO[e.tipo]}</span>${e.comentario ? `<p class="mt-1 text-sm text-muted">«${esc(e.comentario)}»</p>` : ''}</td>
                    <td class="whitespace-nowrap py-3 pr-4 text-muted">${fechaCorta(e.fecha)}</td>
                    <td class="tabular py-3 pr-4 text-muted">×${nota(e.peso)}</td>
                    <td class="tabular py-3 text-right font-display text-lg font-extrabold ${e.nota !== null && e.nota < 5 ? 'text-danger' : ''}">${e.nota === null ? '<span class="font-sans text-sm font-medium text-muted">Sin nota</span>' : nota(e.nota)}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </section>`).join('') : '<p class="panel p-6 text-muted">Aún no hay evaluaciones en tus asignaturas.</p>'}
    </div>`)
}

// ── Profesor y admin: cuaderno de notas de una asignatura ──────────────────

type Cuaderno = {
  asignatura: { id: number; nombre: string }
  evaluaciones: Evaluacion[]
  alumnos: { id: number; nombre: string }[]
  notas: { evaluacionId: number; alumnoId: number; nota: number; comentario: string | null }[]
}

async function cuaderno() {
  const u = usuario()!
  const todas = await api<{ id: number; nombre: string; profesor: { id: number } }[]>('/asignaturas')
  const mias = todas.filter((a) => u.rol === 'admin' || a.profesor.id === u.id)
  const el = html(`<div class="space-y-8"></div>`)
  if (!mias.length) {
    el.append(html(`<p class="panel p-6 text-muted">No tienes asignaturas. Crea una en <a href="/asignaturas" class="font-semibold underline">Asignaturas</a>.</p>`))
    return el
  }
  let actual = Number(new URLSearchParams(location.search).get('asignatura')) || mias[0].id
  if (!mias.some((a) => a.id === actual)) actual = mias[0].id

  async function pintar() {
    const c = await api<Cuaderno>(`/asignaturas/${actual}/notas`)
    const valor = (e: number, a: number) => c.notas.find((n) => n.evaluacionId === e && n.alumnoId === a)?.nota ?? null
    el.innerHTML = `
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="font-display text-4xl font-extrabold tracking-tight">Notas</h1>
          <p class="mt-2 text-lg text-muted">Escribe la nota y sal de la casilla: se guarda sola.</p>
        </div>
        <label class="font-semibold">Asignatura
          <select data-asignatura class="campo w-72 max-w-full">${mias.map((a) => `<option value="${a.id}" ${a.id === actual ? 'selected' : ''}>${esc(a.nombre)}</option>`).join('')}</select>
        </label>
      </header>

      <section class="panel p-6" aria-labelledby="titulo-cuaderno">
        <div class="flex flex-wrap items-center gap-4">
          ${pegatina(c.asignatura)}
          <h2 id="titulo-cuaderno" class="font-display text-xl font-extrabold">${esc(c.asignatura.nombre)}</h2>
          <p data-estado role="status" class="ml-auto text-sm font-medium text-muted"></p>
        </div>
        ${c.evaluaciones.length ? `
          <div class="mt-4 overflow-x-auto">
            <table class="w-full text-left">
              <thead class="align-bottom text-sm">
                <tr>
                  <th class="py-2 pr-4 font-semibold text-muted">Alumno</th>
                  ${c.evaluaciones.map((e) => `
                    <th class="min-w-28 px-2 py-2 font-semibold">
                      <span class="block">${esc(e.titulo)}</span>
                      <span class="block font-normal text-muted">${fechaCorta(e.fecha)} · ×${nota(e.peso)}</span>
                      <button data-borrar-eval="${e.id}" data-confirmar="¿Borrar?" class="btn btn-texto -ml-2 mt-1 px-2 py-1 text-xs" aria-label="Borrar la evaluación ${esc(e.titulo)} y sus notas">${icono('borrar', 'size-3.5')}</button>
                    </th>`).join('')}
                  <th class="py-2 pl-2 text-right font-semibold text-muted">Media</th>
                </tr>
              </thead>
              <tbody>
                ${c.alumnos.map((a) => `
                  <tr class="border-t border-line">
                    <th scope="row" class="py-2 pr-4 font-semibold">${esc(a.nombre)}</th>
                    ${c.evaluaciones.map((e) => `
                      <td class="px-2 py-2"><input type="number" min="0" max="10" step="0.1" inputmode="decimal" value="${valor(e.id, a.id) ?? ''}" data-eval="${e.id}" data-alumno="${a.id}" aria-label="Nota de ${esc(a.nombre)} en ${esc(e.titulo)}" class="campo tabular mt-0 w-20 py-1.5 text-right"></td>`).join('')}
                    <td data-media="${a.id}" class="tabular py-2 pl-2 text-right font-display text-lg font-extrabold">${fmtMedia(c, a.id)}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>` : '<p class="mt-4 text-muted">Esta asignatura aún no tiene evaluaciones. Crea la primera aquí debajo.</p>'}
      </section>

      <form data-nueva class="panel grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_100px_auto] lg:items-end">
        <h2 class="font-display text-xl font-extrabold sm:col-span-full">Nueva evaluación</h2>
        <label class="block font-semibold">Título<input name="titulo" required class="campo" placeholder="Examen T3"></label>
        <label class="block font-semibold">Tipo<select name="tipo" class="campo">${Object.entries(TIPO).map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></label>
        <label class="block font-semibold">Fecha<input name="fecha" type="datetime-local" required value="${fechaLocal(new Date(Date.now() + 7 * 86_400_000)).slice(0, 11)}09:00" class="campo"></label>
        <label class="block font-semibold">Peso<input name="peso" type="number" min="0.1" max="100" step="0.1" value="1" class="campo tabular"></label>
        <button class="btn btn-primario">${icono('mas', 'size-4')}Añadir</button>
        <p data-error role="alert" class="text-sm font-medium text-danger empty:hidden sm:col-span-full"></p>
      </form>`
    datos = c
  }
  let datos: Cuaderno
  const fmtMedia = (c: Cuaderno, alumnoId: number) => {
    const m = media(c.evaluaciones.map((e) => ({ peso: e.peso, nota: c.notas.find((n) => n.evaluacionId === e.id && n.alumnoId === alumnoId)?.nota ?? null })))
    return m === null ? '<span class="font-sans text-sm font-medium text-muted">—</span>' : nota(Math.round(m * 100) / 100)
  }

  await pintar()

  el.addEventListener('change', async (e) => {
    const t = e.target as HTMLInputElement | HTMLSelectElement
    if (t.matches('[data-asignatura]')) {
      if (Number(t.value) === actual) return
      actual = Number(t.value)
      history.replaceState(null, '', `/notas?asignatura=${actual}`)
      return pintar()
    }
    if (!t.matches('[data-eval]')) return
    const estado = el.querySelector<HTMLElement>('[data-estado]')!
    const [evaluacionId, alumnoId] = [Number(t.dataset.eval), Number(t.dataset.alumno)]
    try {
      if (t.value === '') {
        await api(`/evaluaciones/${evaluacionId}/notas/${alumnoId}`, { method: 'PUT', body: JSON.stringify({ nota: '' }) })
        datos.notas = datos.notas.filter((n) => !(n.evaluacionId === evaluacionId && n.alumnoId === alumnoId))
      } else {
        const n = await api<Cuaderno['notas'][number]>(`/evaluaciones/${evaluacionId}/notas/${alumnoId}`, { method: 'PUT', body: JSON.stringify({ nota: Number(t.value) }) })
        datos.notas = [...datos.notas.filter((x) => !(x.evaluacionId === evaluacionId && x.alumnoId === alumnoId)), n]
      }
      el.querySelector(`[data-media="${alumnoId}"]`)!.innerHTML = fmtMedia(datos, alumnoId)
      t.removeAttribute('aria-invalid')
      estado.className = 'ml-auto text-sm font-medium text-ok'
      estado.textContent = 'Guardado'
    } catch (err) {
      t.setAttribute('aria-invalid', 'true')
      estado.className = 'ml-auto text-sm font-medium text-danger'
      estado.textContent = (err as Error).message
    }
  })

  el.addEventListener('click', async (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('[data-borrar-eval]')
    if (!b || !confirmado(b)) return
    await api(`/evaluaciones/${b.dataset.borrarEval}`, { method: 'DELETE' })
    await pintar()
  })

  el.addEventListener('submit', async (e) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const f = Object.fromEntries(new FormData(form))
    try {
      await api(`/asignaturas/${actual}/evaluaciones`, { method: 'POST', body: JSON.stringify({ ...f, fecha: new Date(String(f.fecha)).toISOString() }) })
      await pintar()
    } catch (err) {
      form.querySelector('[data-error]')!.textContent = (err as Error).message
    }
  })

  return el
}
