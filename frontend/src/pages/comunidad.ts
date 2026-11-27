// Propuestas de proyectos y ofertas de trabajo/prácticas.
import { api } from '../api'
import { esc, html } from '../html'
import { markdown } from '../markdown'
import { usuario } from '../session'
import { confirmado, cuando, icono } from '../ui'

/** Página con cabecera, botón que despliega un formulario, lista y recarga tras cada acción. */
async function paginaConFormulario(opts: {
  titulo: string; sub: string; boton: string; formulario: string
  cargar: () => Promise<string>
  enviar: (datos: Record<string, FormDataEntryValue>) => Promise<unknown>
  acciones: Record<string, (id: string) => Promise<unknown>>
}) {
  const el = html(`
    <div class="space-y-8">
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="font-display text-4xl font-extrabold tracking-tight">${opts.titulo}</h1>
          <p class="mt-2 text-lg text-muted">${opts.sub}</p>
        </div>
        <button data-abrir class="btn btn-primario" aria-expanded="false" aria-controls="formulario">${icono('mas', 'size-4')}${opts.boton}</button>
      </header>
      <form id="formulario" hidden class="panel grid gap-4 p-6 sm:grid-cols-2">
        ${opts.formulario}
        <p data-error role="alert" class="text-sm font-medium text-danger empty:hidden sm:col-span-2"></p>
        <div><button class="btn btn-primario">Publicar</button></div>
      </form>
      <p data-error-lista role="alert" class="font-medium text-danger empty:hidden"></p>
      <div data-lista></div>
    </div>`)

  const lista = el.querySelector<HTMLElement>('[data-lista]')!
  const pintar = async () => (lista.innerHTML = await opts.cargar())
  await pintar()

  const form = el.querySelector<HTMLFormElement>('#formulario')!
  const abrir = el.querySelector<HTMLButtonElement>('[data-abrir]')!
  abrir.addEventListener('click', () => {
    form.hidden = !form.hidden
    abrir.setAttribute('aria-expanded', String(!form.hidden))
    if (!form.hidden) form.querySelector('input')!.focus()
  })
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    try {
      await opts.enviar(Object.fromEntries(new FormData(form)))
      form.reset()
      form.hidden = true
      abrir.setAttribute('aria-expanded', 'false')
      await pintar()
      lista.firstElementChild?.firstElementChild?.classList.add('pegar')
    } catch (err) {
      form.querySelector('[data-error]')!.textContent = (err as Error).message
    }
  })
  el.addEventListener('click', async (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('button[data-accion]')
    if (!b || (b.dataset.confirmar && !confirmado(b))) return
    try {
      await opts.acciones[b.dataset.accion!](b.dataset.id!)
      await pintar()
    } catch (err) {
      el.querySelector('[data-error-lista]')!.textContent = (err as Error).message
    }
  })
  return el
}

const campo = (label: string, attrs: string, ancho = '') => `<label class="block font-semibold ${ancho}">${label}<input class="campo" ${attrs}></label>`

// ── Propuestas ─────────────────────────────────────────────────────────────

type Propuesta = {
  id: number; titulo: string; descripcionMd: string; tecnologias: string[]; estado: 'abierta' | 'aprobada' | 'descartada'
  creadoEn: string; autor: { id: number; nombre: string }; _count: { interesados: number }; meInteresa: boolean
}

const ESTADO_PROPUESTA = {
  abierta: '<span class="inline-flex rounded-full border border-dashed border-ink px-2.5 py-0.5 text-xs font-bold">Abierta</span>',
  aprobada: `<span class="inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-0.5 text-xs font-bold text-white">${icono('check', 'size-3.5')}Aprobada</span>`,
  descartada: '<span class="inline-flex rounded-full bg-[#f1f2f5] px-2.5 py-0.5 text-xs font-bold text-muted line-through">Descartada</span>',
}

export function propuestasPage() {
  const u = usuario()!
  const profe = u.rol !== 'alumno'
  return paginaConFormulario({
    titulo: 'Propuestas',
    sub: 'Ideas de proyecto de la clase. Apúntate a las que te molen; el profesor puede aprobarlas.',
    boton: 'Proponer proyecto',
    formulario:
      campo('Título', 'name="titulo" required placeholder="Bot de Discord para dudas de clase"', 'sm:col-span-2') +
      '<label class="block font-semibold sm:col-span-2">La idea <span class="font-normal text-muted">(Markdown)</span><textarea name="descripcionMd" required rows="4" class="campo"></textarea></label>' +
      campo('Tecnologías <span class="font-normal text-muted">(separadas por comas)</span>', 'name="tecnologias" placeholder="Node, Express, Prisma"', 'sm:col-span-2'),
    enviar: (d) => api('/propuestas', { method: 'POST', body: JSON.stringify(d) }),
    acciones: {
      interes: (id) => api(`/propuestas/${id}/interes`, { method: 'PUT' }),
      'quitar-interes': (id) => api(`/propuestas/${id}/interes`, { method: 'DELETE' }),
      aprobada: (id) => api(`/propuestas/${id}`, { method: 'PATCH', body: JSON.stringify({ estado: 'aprobada' }) }),
      descartada: (id) => api(`/propuestas/${id}`, { method: 'PATCH', body: JSON.stringify({ estado: 'descartada' }) }),
      borrar: (id) => api(`/propuestas/${id}`, { method: 'DELETE' }),
    },
    cargar: async () => {
      const propuestas = await api<Propuesta[]>('/propuestas')
      if (!propuestas.length) return '<p class="panel p-6 text-muted">Todavía no hay propuestas. ¿Tienes una idea?</p>'
      return `<ul class="space-y-6">${propuestas.map((p) => `
        <li class="panel p-6 ${p.estado === 'descartada' ? 'opacity-70' : ''}">
          <div class="flex flex-wrap items-start gap-x-4 gap-y-2">
            <div class="min-w-0 flex-1 basis-64">
              <div class="flex flex-wrap items-center gap-2.5">${ESTADO_PROPUESTA[p.estado]}<h2 class="font-display text-xl font-extrabold">${esc(p.titulo)}</h2></div>
              <p class="mt-1 text-sm text-muted">${esc(p.autor.nombre)} · ${cuando(p.creadoEn)}</p>
            </div>
            <button data-accion="${p.meInteresa ? 'quitar-interes' : 'interes'}" data-id="${p.id}" aria-pressed="${p.meInteresa}" class="btn ${p.meInteresa ? 'btn-primario' : 'btn-secundario'} px-3 py-2 text-sm">
              ${icono(p.meInteresa ? 'check' : 'mas', 'size-4')}${p.meInteresa ? 'Te interesa' : 'Me interesa'} <span class="tabular opacity-80">· ${p._count.interesados}</span>
            </button>
          </div>
          <div class="prosa mt-3">${markdown(p.descripcionMd)}</div>
          ${p.tecnologias.length ? `<ul class="mt-4 flex flex-wrap gap-2" aria-label="Tecnologías">${p.tecnologias.map((t) => `<li class="rounded-md bg-[#f1f2f5] px-2 py-1 text-sm font-semibold">${esc(t)}</li>`).join('')}</ul>` : ''}
          ${profe || p.autor.id === u.id ? `
            <div class="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
              ${profe && p.estado !== 'aprobada' ? `<button data-accion="aprobada" data-id="${p.id}" class="btn btn-secundario px-3 py-2 text-sm">${icono('check', 'size-4')}Aprobar</button>` : ''}
              ${profe && p.estado !== 'descartada' ? `<button data-accion="descartada" data-id="${p.id}" class="btn btn-texto text-sm">Descartar</button>` : ''}
              ${p.autor.id === u.id || u.rol === 'admin' ? `<button data-accion="borrar" data-id="${p.id}" data-confirmar="¿Borrar la propuesta?" class="btn btn-texto ml-auto text-sm">${icono('borrar', 'size-4')}Borrar</button>` : ''}
            </div>` : ''}
        </li>`).join('')}</ul>`
    },
  })
}

// ── Ofertas ────────────────────────────────────────────────────────────────

type Oferta = { id: number; titulo: string; empresa: string; url: string; ubicacion: string | null; tipo: 'empleo' | 'practicas'; aprobada: boolean; autor: { id: number; nombre: string } }

export function ofertasPage() {
  const u = usuario()!
  const profe = u.rol !== 'alumno'
  return paginaConFormulario({
    titulo: 'Ofertas',
    sub: profe ? 'Empleo y prácticas para la clase. Las que proponen los alumnos esperan tu aprobación.' : 'Empleo y prácticas. Si compartes una, la verá la clase cuando un profesor la apruebe.',
    boton: 'Compartir oferta',
    formulario:
      campo('Puesto', 'name="titulo" required placeholder="Prácticas frontend"') +
      campo('Empresa', 'name="empresa" required') +
      campo('Enlace a la oferta', 'name="url" type="url" required placeholder="https://"') +
      campo('Ubicación <span class="font-normal text-muted">(opcional)</span>', 'name="ubicacion" placeholder="Madrid (híbrido)"') +
      '<label class="block font-semibold">Tipo<select name="tipo" class="campo"><option value="practicas">Prácticas</option><option value="empleo">Empleo</option></select></label>',
    enviar: (d) => api('/ofertas', { method: 'POST', body: JSON.stringify(d) }),
    acciones: {
      aprobar: (id) => api(`/ofertas/${id}/aprobar`, { method: 'PATCH' }),
      borrar: (id) => api(`/ofertas/${id}`, { method: 'DELETE' }),
    },
    cargar: async () => {
      const ofertas = await api<Oferta[]>('/ofertas')
      if (!ofertas.length) return '<p class="panel p-6 text-muted">No hay ofertas ahora mismo.</p>'
      return `<ul class="panel divide-y divide-line">${ofertas.map((o) => `
        <li class="flex flex-wrap items-center gap-x-5 gap-y-3 px-6 py-5">
          <span class="grid size-10 shrink-0 place-items-center rounded-xl ${o.aprobada ? 'bg-[#f1f2f5]' : 'border-2 border-dashed border-[#9aa1ad]'}">${icono('ofertas')}</span>
          <div class="min-w-0 flex-1 basis-56">
            <p class="flex flex-wrap items-center gap-2"><span class="text-lg font-semibold">${esc(o.titulo)}</span>
              ${o.aprobada ? '' : '<span class="inline-flex items-center gap-1 rounded-full border border-dashed border-ink px-2 py-0.5 text-xs font-bold">Pendiente de aprobar</span>'}
            </p>
            <p class="mt-0.5 flex flex-wrap items-center gap-x-2 text-muted">
              <span class="font-semibold text-ink">${esc(o.empresa)}</span><span aria-hidden="true">·</span><span>${o.tipo === 'practicas' ? 'Prácticas' : 'Empleo'}</span>
              ${o.ubicacion ? `<span aria-hidden="true">·</span><span class="inline-flex items-center gap-1">${icono('lugar', 'size-4')}${esc(o.ubicacion)}</span>` : ''}
              <span aria-hidden="true">·</span><span class="text-sm">la compartió ${esc(o.autor.nombre)}</span>
            </p>
          </div>
          <div class="flex shrink-0 flex-wrap items-center gap-2">
            ${profe && !o.aprobada ? `<button data-accion="aprobar" data-id="${o.id}" class="btn btn-primario px-3 py-2 text-sm">${icono('check', 'size-4')}Aprobar</button>` : ''}
            <a href="${esc(o.url)}" target="_blank" rel="noopener" class="btn btn-secundario px-3 py-2 text-sm">Ver oferta${icono('externo', 'size-4')}</a>
            ${profe || o.autor.id === u.id ? `<button data-accion="borrar" data-id="${o.id}" data-confirmar="¿Borrar?" class="btn btn-texto" aria-label="Borrar la oferta ${esc(o.titulo)}">${icono('borrar', 'size-4')}</button>` : ''}
          </div>
        </li>`).join('')}</ul>`
    },
  })
}
