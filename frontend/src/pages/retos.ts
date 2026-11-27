import { api } from '../api'
import { esc, html } from '../html'
import { markdown } from '../markdown'
import { navigate, type Params } from '../router'
import { usuario } from '../session'
import { chip, confirmado, cuando, fechaCorta, fechaHora, fechaLocal, icono } from '../ui'

type Estado = 'proximo' | 'abierto' | 'cerrado'
type RetoLista = {
  id: number; titulo: string; inicio: string; fin: string; maxMiembros: number; estado: Estado
  asignatura: { id: number; nombre: string } | null; _count: { equipos: number }; miEquipo: { id: number; nombre: string } | null
}
type Equipo = {
  id: number; nombre: string; repoUrl: string | null; demoUrl: string | null; entregadoEn: string | null
  miembros: { id: number; nombre: string; githubUsername: string | null }[]; votos: number | null
}
type Reto = Omit<RetoLista, '_count' | 'miEquipo'> & {
  descripcionMd: string; creadoPor: { nombre: string }; puedeGestionar: boolean
  miEquipoId: number | null; miVotoEquipoId: number | null; equipos: Equipo[]
}

/** El estado se lee por la forma: abierto relleno, próximo discontinuo, cerrado apagado. */
export const sello = (e: Estado) => ({
  abierto: '<span class="inline-flex items-center rounded-full bg-ink px-2.5 py-1 text-xs font-bold text-white">Abierto</span>',
  proximo: `<span class="inline-flex items-center gap-1 rounded-full border border-dashed border-ink px-2.5 py-1 text-xs font-bold">${icono('reloj', 'size-3.5')}Próximo</span>`,
  cerrado: '<span class="inline-flex rounded-full bg-[#f1f2f5] px-2.5 py-1 text-xs font-bold text-muted">Cerrado</span>',
})[e]

const cuandoReto = (r: { estado: Estado; inicio: string; fin: string }) =>
  r.estado === 'proximo' ? `Empieza ${cuando(r.inicio)}` : r.estado === 'abierto' ? `Acaba ${cuando(r.fin)}` : `Terminó ${cuando(r.fin)}`

// ── Lista ──────────────────────────────────────────────────────────────────

export async function retosPage() {
  const u = usuario()!
  const puedeCrear = u.rol !== 'alumno'
  const [retos, asignaturas] = await Promise.all([
    api<RetoLista[]>('/retos'),
    puedeCrear ? api<{ id: number; nombre: string }[]>('/asignaturas') : Promise.resolve([]),
  ])
  const orden: Record<Estado, number> = { abierto: 0, proximo: 1, cerrado: 2 }
  retos.sort((a, b) => orden[a.estado] - orden[b.estado])
  const manana = new Date(Date.now() + 86_400_000)

  const el = html(`
    <div class="space-y-8">
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="font-display text-4xl font-extrabold tracking-tight">Retos</h1>
          <p class="mt-2 text-lg text-muted">Hackathons de clase: formad equipo, entregad repo y demo, y votad al mejor.</p>
        </div>
        ${puedeCrear ? `<button data-abrir class="btn btn-primario" aria-expanded="false" aria-controls="nuevo-reto">${icono('mas', 'size-4')}Nuevo reto</button>` : ''}
      </header>

      ${puedeCrear ? `
        <form id="nuevo-reto" hidden class="panel grid gap-4 p-6 sm:grid-cols-2">
          <label class="block font-semibold sm:col-span-2">Título<input name="titulo" required class="campo" placeholder="Hackathon: app para tu barrio"></label>
          <label class="block font-semibold sm:col-span-2">Descripción <span class="font-normal text-muted">(Markdown)</span><textarea name="descripcionMd" required rows="4" class="campo"></textarea></label>
          <label class="block font-semibold">Empieza<input name="inicio" type="datetime-local" required value="${fechaLocal(new Date()).slice(0, 16)}" class="campo"></label>
          <label class="block font-semibold">Acaba<input name="fin" type="datetime-local" required value="${fechaLocal(manana).slice(0, 16)}" class="campo"></label>
          <label class="block font-semibold">Personas por equipo<input name="maxMiembros" type="number" min="1" max="10" value="4" class="campo tabular"></label>
          <label class="block font-semibold">Asignatura <span class="font-normal text-muted">(opcional)</span>
            <select name="asignaturaId" class="campo"><option value="">Ninguna</option>${asignaturas.map((a) => `<option value="${a.id}">${esc(a.nombre)}</option>`).join('')}</select>
          </label>
          <p data-error role="alert" class="text-sm font-medium text-danger empty:hidden sm:col-span-2"></p>
          <div><button class="btn btn-primario">Publicar reto</button></div>
        </form>` : ''}

      ${retos.length ? `
        <ul class="panel divide-y divide-line">
          ${retos.map((r) => `
            <li>
              <a href="/retos/${r.id}" class="group flex flex-wrap items-center gap-x-6 gap-y-2 px-6 py-5 hover:bg-[#f7f8fa] ${r.estado === 'cerrado' ? 'text-muted' : ''}">
                <span class="min-w-0 flex-1 basis-64">
                  <span class="flex flex-wrap items-center gap-2.5">${sello(r.estado)}<span class="text-lg font-semibold text-ink group-hover:underline">${esc(r.titulo)}</span></span>
                  <span class="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted">
                    ${r.asignatura ? `<span class="inline-flex items-center gap-1.5">${chip(r.asignatura)}${esc(r.asignatura.nombre)}</span><span aria-hidden="true">·</span>` : ''}
                    <span>${cuandoReto(r)}</span><span aria-hidden="true">·</span><span>${r._count.equipos === 1 ? '1 equipo' : `${r._count.equipos} equipos`}</span>
                  </span>
                </span>
                ${r.miEquipo ? `<span class="font-semibold text-ink">Tu equipo: ${esc(r.miEquipo.nombre)}</span>` : ''}
                <span class="text-muted transition-transform group-hover:translate-x-1">${icono('flecha')}</span>
              </a>
            </li>`).join('')}
        </ul>` : `<p class="panel p-6 text-muted">${puedeCrear ? 'No hay retos todavía. Lanza el primero.' : 'No hay retos todavía.'}</p>`}
    </div>`)

  const form = el.querySelector<HTMLFormElement>('#nuevo-reto')
  const abrir = el.querySelector<HTMLButtonElement>('[data-abrir]')
  abrir?.addEventListener('click', () => {
    form!.hidden = !form!.hidden
    abrir.setAttribute('aria-expanded', String(!form!.hidden))
    if (!form!.hidden) form!.querySelector('input')!.focus()
  })
  form?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const f = Object.fromEntries(new FormData(form))
    try {
      const r = await api<{ id: number }>('/retos', {
        method: 'POST',
        body: JSON.stringify({ ...f, inicio: new Date(String(f.inicio)).toISOString(), fin: new Date(String(f.fin)).toISOString() }),
      })
      navigate(`/retos/${r.id}`)
    } catch (err) {
      form.querySelector('[data-error]')!.textContent = (err as Error).message
    }
  })
  return el
}

// ── Detalle ────────────────────────────────────────────────────────────────

export async function retoPage({ id }: Params) {
  const el = html(`<div></div>`)
  const alumno = usuario()!.rol === 'alumno'
  let reto: Reto
  let recienDentro = false // para "pegar" la pegatina una sola vez, al unirse

  async function pintar() {
    reto = await api<Reto>(`/retos/${id}`)
    el.innerHTML = vista(reto, alumno, recienDentro)
    recienDentro = false
  }
  try {
    await pintar()
  } catch {
    return html(`<div class="space-y-4"><h1 class="font-display text-3xl font-extrabold">Ese reto no existe</h1><a href="/retos" class="font-semibold underline">Volver a retos</a></div>`)
  }

  el.addEventListener('click', async (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('button[data-accion]')
    if (!b) return
    if (b.dataset.confirmar && !confirmado(b)) return
    const { accion, equipo } = b.dataset
    try {
      if (accion === 'unirse') {
        await api(`/equipos/${equipo}/unirse`, { method: 'POST' })
        recienDentro = true
      }
      if (accion === 'salir') await api(`/equipos/${equipo}/salir`, { method: 'POST' })
      if (accion === 'votar') await api(`/retos/${id}/voto`, { method: 'PUT', body: JSON.stringify({ equipoId: Number(equipo) }) })
      if (accion === 'borrar-reto') {
        await api(`/retos/${id}`, { method: 'DELETE' })
        return navigate('/retos')
      }
      await pintar()
    } catch (err) {
      el.querySelector('[data-error-reto]')!.textContent = (err as Error).message
    }
  })

  el.addEventListener('submit', async (e) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const f = Object.fromEntries(new FormData(form))
    try {
      if (form.dataset.form === 'equipo') {
        await api(`/retos/${id}/equipos`, { method: 'POST', body: JSON.stringify(f) })
        recienDentro = true
      } else {
        await api(`/equipos/${reto.miEquipoId}/entrega`, { method: 'PATCH', body: JSON.stringify(f) })
      }
      await pintar()
    } catch (err) {
      form.querySelector('[data-error]')!.textContent = (err as Error).message
    }
  })
  return el
}

function vista(r: Reto, alumno: boolean, recienDentro: boolean) {
  const mio = r.equipos.find((e) => e.id === r.miEquipoId)
  const abierto = r.estado === 'abierto'
  return `
    <div class="space-y-8">
      <header class="space-y-4">
        <a href="/retos" class="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"><span class="rotate-180">${icono('flecha', 'size-4')}</span>Retos</a>
        <div class="flex flex-wrap items-start gap-x-6 gap-y-3">
          <div class="min-w-[min(100%,20rem)] flex-1">
            <div class="flex flex-wrap items-center gap-3">${sello(r.estado)}<span class="text-muted">${cuandoReto(r)}</span></div>
            <h1 class="mt-3 font-display text-3xl font-extrabold tracking-tight lg:text-4xl">${esc(r.titulo)}</h1>
            <p class="mt-1.5 text-lg text-muted">
              Del ${fechaHora(r.inicio)} al ${fechaHora(r.fin)} · equipos de hasta ${r.maxMiembros} · lo propone ${esc(r.creadoPor.nombre)}${r.asignatura ? ` · <a href="/asignaturas/${r.asignatura.id}" class="inline-flex items-center gap-1.5 underline">${chip(r.asignatura)}${esc(r.asignatura.nombre)}</a>` : ''}
            </p>
          </div>
          ${r.puedeGestionar ? `<button data-accion="borrar-reto" data-confirmar="¿Borrar el reto? Pulsa otra vez" class="btn btn-secundario">${icono('borrar', 'size-4')}Borrar reto</button>` : ''}
        </div>
        <p data-error-reto role="alert" class="font-medium text-danger empty:hidden"></p>
      </header>

      <div class="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div class="space-y-6">
          <section class="panel p-6" aria-labelledby="enunciado"><h2 id="enunciado" class="font-display text-xl font-extrabold">Enunciado</h2><div class="prosa mt-3">${markdown(r.descripcionMd)}</div></section>

          <section class="panel p-6" aria-labelledby="equipos">
            <h2 id="equipos" class="font-display text-xl font-extrabold">Equipos <span class="font-sans text-base font-normal text-muted">(${r.equipos.length})</span></h2>
            ${r.equipos.length ? `<ul class="mt-3">${r.equipos.map((e) => equipo(e, r, alumno)).join('')}</ul>` : '<p class="mt-3 text-muted">Todavía no hay equipos. ¡Sé el primero!</p>'}
          </section>
        </div>

        <aside class="space-y-6">
          ${alumno ? (mio ? tuEquipo(mio, r, abierto, recienDentro) : r.estado !== 'cerrado' ? `
            <form data-form="equipo" class="panel space-y-4 p-6">
              <h2 class="font-display text-xl font-extrabold">Crea tu equipo</h2>
              <p class="text-muted">O únete a uno de la lista si tiene hueco.</p>
              <label class="block font-semibold">Nombre del equipo<input name="nombre" required maxlength="40" class="campo" placeholder="Los Pull Requesters"></label>
              <p data-error role="alert" class="text-sm font-medium text-danger empty:hidden"></p>
              <button class="btn btn-primario w-full">${icono('usuarios', 'size-4')}Crear equipo</button>
            </form>` : '<p class="panel p-6 text-muted">Este reto ya ha terminado.</p>')
          : `<section class="panel p-6"><h2 class="font-display text-xl font-extrabold">Resultados</h2><p class="mt-2 text-muted">Los alumnos forman equipos, entregan y votan. Tú ves los votos en todo momento; la clase, al cerrar el reto.</p></section>`}
        </aside>
      </div>
    </div>`
}

function equipo(e: Equipo, r: Reto, alumno: boolean) {
  const esMio = e.id === r.miEquipoId
  const lleno = e.miembros.length >= r.maxMiembros
  const puedoUnirme = alumno && !r.miEquipoId && r.estado !== 'cerrado' && !lleno
  const puedoVotar = alumno && !esMio && !!e.entregadoEn && r.estado !== 'proximo'
  const votado = r.miVotoEquipoId === e.id
  return `
    <li class="border-t border-line py-4 first:border-0">
      <div class="flex flex-wrap items-start gap-x-4 gap-y-3">
        <div class="min-w-0 flex-1 basis-56">
          <p class="flex flex-wrap items-center gap-2 font-semibold">${esc(e.nombre)}${esMio ? '<span class="rounded-full bg-ink px-2 py-0.5 text-xs font-bold text-white">Tu equipo</span>' : ''}</p>
          <p class="mt-1 text-sm text-muted">${e.miembros.map((m) => `${esc(m.nombre)}${m.githubUsername ? ` <span class="text-xs">@${esc(m.githubUsername)}</span>` : ''}`).join(', ')} · ${e.miembros.length}/${r.maxMiembros}</p>
          <p class="mt-2 flex flex-wrap items-center gap-2 text-sm">
            ${e.entregadoEn ? `
              <span class="inline-flex items-center gap-1 font-semibold text-ok">${icono('check', 'size-4')}Entregado ${cuando(e.entregadoEn)}</span>
              ${e.repoUrl ? `<a href="${esc(e.repoUrl)}" target="_blank" rel="noopener" class="font-semibold underline">Repo</a>` : ''}
              ${e.demoUrl ? `<a href="${esc(e.demoUrl)}" target="_blank" rel="noopener" class="font-semibold underline">Demo</a>` : ''}`
            : '<span class="inline-flex rounded-full border border-dashed border-muted px-2 py-0.5 text-xs font-semibold text-muted">Sin entregar</span>'}
          </p>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          ${e.votos !== null ? `<span class="tabular text-sm text-muted"><b class="font-display text-lg font-extrabold text-ink">${e.votos}</b> ${e.votos === 1 ? 'voto' : 'votos'}</span>` : ''}
          ${puedoVotar ? `<button data-accion="votar" data-equipo="${e.id}" aria-pressed="${votado}" class="btn ${votado ? 'btn-primario' : 'btn-secundario'} px-3 py-2 text-sm">${icono(votado ? 'check' : 'votar', 'size-4')}${votado ? 'Tu voto' : 'Votar'}</button>` : ''}
          ${puedoUnirme ? `<button data-accion="unirse" data-equipo="${e.id}" class="btn btn-secundario px-3 py-2 text-sm">Unirme</button>` : ''}
        </div>
      </div>
    </li>`
}

function tuEquipo(e: Equipo, r: Reto, abierto: boolean, recienDentro: boolean) {
  return `
    <section class="relative rounded-[14px] bg-ink p-6 text-white" aria-labelledby="tu-equipo">
      <span class="sticker ${recienDentro ? 'pegar' : ''} absolute -top-3.5 right-5 rotate-6 bg-mint px-3 py-1.5 text-sm">¡Estás dentro!</span>
      <h2 id="tu-equipo" class="font-display text-2xl font-extrabold leading-tight">${esc(e.nombre)}</h2>
      <p class="mt-1 text-rail-text">${e.miembros.map((m) => esc(m.nombre)).join(', ')}</p>
      ${abierto ? `
        <form data-form="entrega" class="mt-5 space-y-3">
          <label class="block text-sm font-semibold">Repositorio<input name="repoUrl" type="url" required value="${esc(e.repoUrl ?? '')}" placeholder="https://github.com/…" class="campo"></label>
          <label class="block text-sm font-semibold">Demo <span class="font-normal text-rail-text">(opcional)</span><input name="demoUrl" type="url" value="${esc(e.demoUrl ?? '')}" placeholder="https://….vercel.app" class="campo"></label>
          <p data-error role="alert" class="text-sm font-medium text-[#ffb4a1] empty:hidden"></p>
          <button class="btn w-full bg-white text-ink hover:bg-ground">${e.entregadoEn ? 'Actualizar entrega' : 'Entregar repo y demo'}</button>
        </form>` : `<p class="mt-4 text-rail-text">${e.entregadoEn ? `Entregasteis ${cuando(e.entregadoEn)}.` : r.estado === 'proximo' ? `La entrega se abre el ${fechaCorta(r.inicio)}.` : 'No llegasteis a entregar.'}</p>`}
      ${r.estado !== 'cerrado' ? `<button data-accion="salir" data-equipo="${e.id}" data-confirmar="¿Salir del equipo?" class="btn btn-texto mt-3 w-full text-rail-text hover:bg-rail hover:text-white">Salir del equipo</button>` : ''}
    </section>`
}
