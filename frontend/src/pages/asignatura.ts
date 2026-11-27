import { api } from '../api'
import { esc, html } from '../html'
import { markdown } from '../markdown'
import { navigate, type Params } from '../router'
import { confirmado, cuando, fechaHora, fechaLocal, icono, pegatina, tamano, type Icono } from '../ui'

type Tipo = 'apunte' | 'video' | 'enlace' | 'proyecto'
type Recurso = {
  id: number; tipo: Tipo; titulo: string; contenidoMd: string | null; url: string | null
  archivoNombre: string | null; archivoBytes: number | null; visible: boolean; visibleDesde: string | null; creadoEn: string
}
type Tema = { id: number; titulo: string; orden: number; recursos: Recurso[] }
type Detalle = { id: number; nombre: string; curso: string; profesor: { nombre: string }; editable: boolean; temas: Tema[] }

const TIPOS: [Tipo, string][] = [['apunte', 'Apunte'], ['video', 'Vídeo'], ['enlace', 'Enlace'], ['proyecto', 'Proyecto']]
const NOMBRE_TIPO = Object.fromEntries(TIPOS) as Record<Tipo, string>
const MAX_BYTES = 20 * 1024 * 1024
const ACEPTA = '.pdf,.png,.jpg,.jpeg,.gif,.webp,.zip,.txt,.md,.json,.ts,.js,.css,.html,.java,.py,.sql,.php,.c,.cpp,.cs,.kt,.xml,.yml,.yaml'

/** Lo que ve el alumno: visible y, si está programado, con la fecha ya pasada. */
function estado(r: Recurso): 'visible' | 'oculto' | 'programado' {
  if (!r.visible) return 'oculto'
  return r.visibleDesde && new Date(r.visibleDesde) > new Date() ? 'programado' : 'visible'
}

export async function asignaturaPage({ id }: Params) {
  const el = html(`<div></div>`)
  let datos: Detalle
  let recienPegado: string | null = null // id del elemento recién creado, para la animación de "pegar"

  async function pintar() {
    datos = await api<Detalle>(`/asignaturas/${id}`)
    const comoAlumno = el.querySelector<HTMLInputElement>('[data-como-alumno]')?.checked
    el.replaceChildren(html(vista(datos)))
    el.querySelector<HTMLInputElement>('[data-como-alumno]')?.toggleAttribute('checked', !!comoAlumno)
    el.firstElementChild!.classList.toggle('como-alumno', !!comoAlumno)
    if (recienPegado) el.querySelector(`#${recienPegado}`)?.classList.add('pegar')
    recienPegado = null
  }

  try {
    await pintar()
  } catch {
    return html(`<div class="space-y-4"><h1 class="font-display text-3xl font-extrabold">Esa asignatura no existe</h1><a href="/asignaturas" class="font-semibold underline">Volver a asignaturas</a></div>`)
  }

  // Si se llega con #recurso-12 (desde "Hoy"), se lleva el recurso a la vista
  if (location.hash) setTimeout(() => el.querySelector(location.hash)?.scrollIntoView({ block: 'center' }))

  el.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement
    if (t.matches('[data-como-alumno]')) el.firstElementChild!.classList.toggle('como-alumno', t.checked)
  })

  el.addEventListener('click', async (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('button[data-accion]')
    if (!b) return
    const { accion, id: bid, tema } = b.dataset
    if (b.dataset.confirmar && !confirmado(b)) return
    try {
      if (accion === 'editar-asignatura') alternar(el.querySelector('#form-asignatura')!)
      if (accion === 'renombrar-tema') alternar(el.querySelector(`#renombrar-${bid}`)!)
      if (accion === 'nuevo-recurso') {
        b.hidden = true
        el.querySelector(`#nuevo-${tema}`)!.replaceChildren(html(formRecurso(Number(tema))))
        el.querySelector<HTMLInputElement>(`#nuevo-${tema} [name=titulo]`)!.focus()
      }
      if (accion === 'editar-recurso') {
        const r = datos.temas.flatMap((t) => t.recursos).find((x) => x.id === Number(bid))!
        el.querySelector(`#editar-${bid}`)!.replaceChildren(html(formRecurso(0, r)))
      }
      if (accion === 'cancelar') {
        b.closest('form')!.remove()
        el.querySelectorAll<HTMLElement>('[data-accion=nuevo-recurso]').forEach((x) => (x.hidden = false))
      }
      if (accion === 'borrar-asignatura') {
        await api(`/asignaturas/${id}`, { method: 'DELETE' })
        navigate('/asignaturas')
      }
      if (accion === 'borrar-tema') await api(`/temas/${bid}`, { method: 'DELETE' }).then(pintar)
      if (accion === 'borrar-recurso') await api(`/recursos/${bid}`, { method: 'DELETE' }).then(pintar)
    } catch (err) {
      b.closest('section, header')?.querySelector('[data-error]')?.replaceChildren((err as Error).message)
    }
  })

  el.addEventListener('submit', async (e) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const error = form.querySelector('[data-error]')!
    const enviar = form.querySelector<HTMLButtonElement>('button:not([type=button])')!
    const textoBoton = enviar.textContent
    enviar.disabled = true
    error.textContent = ''
    try {
      const f = new FormData(form)
      const tipo = form.dataset.form
      if (tipo === 'asignatura') {
        await api(`/asignaturas/${id}`, { method: 'PATCH', body: JSON.stringify({ nombre: f.get('nombre'), curso: f.get('curso') }) })
      } else if (tipo === 'tema') {
        const t = await api<{ id: number }>(`/asignaturas/${id}/temas`, { method: 'POST', body: JSON.stringify({ titulo: f.get('titulo') }) })
        recienPegado = `tema-${t.id}`
      } else if (tipo === 'renombrar-tema') {
        await api(`/temas/${form.dataset.id}`, { method: 'PATCH', body: JSON.stringify({ titulo: f.get('titulo') }) })
      } else if (tipo === 'recurso') {
        enviar.textContent = 'Guardando…'
        const r = await guardarRecurso(form, f, (texto) => (enviar.textContent = texto))
        recienPegado = `recurso-${r.id}`
      }
      await pintar()
    } catch (err) {
      error.textContent = (err as Error).message
      enviar.disabled = false
      enviar.textContent = textoBoton
    }
  })

  return el
}

// ── Guardar ────────────────────────────────────────────────────────────────

async function guardarRecurso(form: HTMLFormElement, f: FormData, aviso: (t: string) => void) {
  const visibilidad = f.get('visibilidad')
  const desde = String(f.get('desde') ?? '')
  if (visibilidad === 'programado' && !desde) throw new Error('Elige cuándo se publica')
  const archivo = f.get('archivo') as File | null
  if (archivo?.size && archivo.size > MAX_BYTES) throw new Error('El archivo pesa más de 20 MB')

  const body = JSON.stringify({
    tipo: f.get('tipo'),
    titulo: f.get('titulo'),
    url: f.get('url') ?? '',
    contenidoMd: f.get('contenidoMd') ?? '',
    visible: visibilidad !== 'oculto',
    visibleDesde: visibilidad === 'programado' ? new Date(desde).toISOString() : null,
  })
  const id = form.dataset.id
  const r = await api<Recurso>(id ? `/recursos/${id}` : `/temas/${form.dataset.tema}/recursos`, { method: id ? 'PATCH' : 'POST', body })

  if (archivo?.size) {
    aviso('Subiendo archivo…')
    await subirArchivo(r.id, archivo)
  } else if (f.get('quitarArchivo')) {
    await api(`/recursos/${r.id}/archivo`, { method: 'DELETE' })
  }
  return r
}

/** El backend da una URL firmada y el navegador sube el archivo directamente a Supabase (no pasa por Vercel). */
async function subirArchivo(recursoId: number, archivo: File) {
  const { uploadUrl } = await api<{ uploadUrl: string }>(`/recursos/${recursoId}/archivo`, {
    method: 'POST',
    body: JSON.stringify({ nombre: archivo.name, bytes: archivo.size }),
  })
  const res = await fetch(uploadUrl, { method: 'PUT', body: archivo, headers: { 'Content-Type': archivo.type || 'application/octet-stream', 'x-upsert': 'true' } })
  if (!res.ok) throw new Error('El recurso se guardó, pero el archivo no se pudo subir. Edítalo y vuelve a intentarlo.')
}

// ── Vista ──────────────────────────────────────────────────────────────────

function vista(a: Detalle) {
  return `
    <div class="space-y-8">
      <header class="space-y-4">
        <a href="/asignaturas" class="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"><span class="rotate-180">${icono('flecha', 'size-4')}</span>Asignaturas</a>
        <div class="flex flex-wrap items-center gap-x-6 gap-y-4">
          ${pegatina(a, { grande: true })}
          <div class="min-w-[min(100%,18rem)] flex-1">
            <h1 class="font-display text-3xl font-extrabold tracking-tight lg:text-4xl">${esc(a.nombre)}</h1>
            <p class="mt-1.5 text-lg text-muted">${esc(a.curso)} · ${esc(a.profesor.nombre)} · ${a.temas.length === 1 ? '1 tema' : `${a.temas.length} temas`}</p>
          </div>
          ${a.editable ? `
            <div class="flex w-full gap-2 sm:w-auto">
              <button data-accion="editar-asignatura" class="btn btn-secundario">${icono('editar', 'size-4')}Editar</button>
              <button data-accion="borrar-asignatura" data-confirmar="¿Borrar con todos sus temas? Pulsa otra vez" class="btn btn-secundario">${icono('borrar', 'size-4')}Borrar</button>
            </div>` : ''}
        </div>
        <p data-error role="alert" class="font-medium text-danger empty:hidden"></p>
        ${a.editable ? `
          <form id="form-asignatura" data-form="asignatura" hidden class="panel grid gap-4 p-5 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
            <label class="block font-semibold">Nombre<input name="nombre" required value="${esc(a.nombre)}" class="campo"></label>
            <label class="block font-semibold">Curso<input name="curso" required value="${esc(a.curso)}" class="campo"></label>
            <button class="btn btn-primario">Guardar</button>
            <p data-error role="alert" class="text-sm font-medium text-danger empty:hidden sm:col-span-full"></p>
          </form>` : ''}
      </header>

      <div class="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside class="lg:sticky lg:top-10 lg:self-start">
          <h2 class="text-sm font-bold text-muted">Temas</h2>
          ${a.temas.length ? `
            <ol class="mt-2 space-y-0.5">
              ${a.temas.map((t, i) => `<li><a href="#tema-${t.id}" class="flex gap-2.5 rounded-lg px-2.5 py-2 font-medium hover:bg-white"><span class="tabular text-muted">${i + 1}</span><span>${esc(t.titulo)}</span></a></li>`).join('')}
            </ol>` : '<p class="mt-2 text-sm text-muted">Ninguno todavía.</p>'}
          ${a.editable ? `
            <label class="mt-6 flex cursor-pointer items-start gap-2.5 rounded-xl bg-white p-3.5 text-sm shadow-[0_1px_0_#d9dde3]">
              <input type="checkbox" data-como-alumno class="mt-0.5 size-4 accent-ink">
              <span><b class="font-semibold">Ver como alumno</b><span class="block text-muted">Oculta lo que la clase todavía no ve.</span></span>
            </label>` : ''}
        </aside>

        <div class="space-y-6">
          ${a.temas.map((t, i) => tema(t, i + 1, a.editable)).join('')}
          ${!a.temas.length && !a.editable ? '<p class="panel p-6 text-muted">Todavía no hay temas publicados en esta asignatura.</p>' : ''}
          ${a.editable ? `
            <form data-form="tema" data-solo-profe class="panel flex flex-wrap items-end gap-3 p-6">
              <label class="block min-w-64 flex-1 font-semibold">${a.temas.length ? 'Nuevo tema' : 'Empieza creando el primer tema'}<input name="titulo" required class="campo" placeholder="Fetch y APIs"></label>
              <button class="btn btn-primario">${icono('mas', 'size-4')}Añadir tema</button>
              <p data-error role="alert" class="w-full text-sm font-medium text-danger empty:hidden"></p>
            </form>` : ''}
        </div>
      </div>
    </div>`
}

function tema(t: Tema, n: number, editable: boolean) {
  return `
    <section id="tema-${t.id}" class="panel scroll-mt-8 p-6" aria-labelledby="titulo-tema-${t.id}">
      <div class="flex items-start gap-3">
        <h2 id="titulo-tema-${t.id}" class="min-w-0 flex-1 font-display text-2xl font-extrabold"><span class="text-muted">Tema ${n}</span> · ${esc(t.titulo)}</h2>
        ${editable ? `
          <div class="flex shrink-0 gap-1" data-solo-profe>
            <button data-accion="renombrar-tema" data-id="${t.id}" class="btn btn-texto" aria-label="Renombrar el tema ${esc(t.titulo)}">${icono('editar', 'size-4')}</button>
            <button data-accion="borrar-tema" data-id="${t.id}" data-confirmar="¿Borrar tema y recursos?" class="btn btn-texto" aria-label="Borrar el tema ${esc(t.titulo)}">${icono('borrar', 'size-4')}</button>
          </div>` : ''}
      </div>
      <p data-error role="alert" class="mt-2 text-sm font-medium text-danger empty:hidden"></p>
      ${editable ? `
        <form id="renombrar-${t.id}" data-form="renombrar-tema" data-id="${t.id}" hidden class="mt-3 flex gap-3">
          <label class="flex-1"><span class="sr-only">Título del tema</span><input name="titulo" required value="${esc(t.titulo)}" class="campo mt-0"></label>
          <button class="btn btn-primario">Guardar</button>
          <p data-error role="alert" class="text-sm text-danger empty:hidden"></p>
        </form>` : ''}

      ${t.recursos.length ? `<ul class="mt-3">${t.recursos.map((r) => recurso(r, editable)).join('')}</ul>`
        : `<p class="mt-3 text-muted">${editable ? 'Sin recursos todavía.' : 'Aún no hay recursos publicados en este tema.'}</p>`}

      ${editable ? `
        <div id="nuevo-${t.id}"></div>
        <button data-accion="nuevo-recurso" data-tema="${t.id}" data-solo-profe class="btn btn-secundario mt-4">${icono('mas', 'size-4')}Añadir recurso</button>` : ''}
    </section>`
}

const ICONO_TIPO: Record<Tipo, Icono> = { apunte: 'apunte', video: 'video', enlace: 'enlace', proyecto: 'proyecto' }

function recurso(r: Recurso, editable: boolean) {
  const e = estado(r)
  // El estado se lee por la forma, no solo por el color: oculto tachado, programado con borde discontinuo
  const sello = !editable ? '' : {
    visible: '<span class="inline-flex items-center gap-1.5"><span class="size-2 rounded-full bg-ok"></span>Visible</span>',
    oculto: `<span class="inline-flex items-center gap-1 rounded-full border border-muted px-2 py-0.5 font-semibold text-ink">${icono('oculto', 'size-3.5')}Oculto</span>`,
    programado: `<span class="inline-flex flex-wrap items-center gap-x-1 rounded-2xl border border-dashed border-ink px-2 py-0.5 font-semibold text-ink"><span class="inline-flex items-center gap-1 whitespace-nowrap">${icono('reloj', 'size-3.5')}Se publica ${cuando(r.visibleDesde!)} ·</span><span class="whitespace-nowrap">${fechaHora(r.visibleDesde!)}</span></span>`,
  }[e]

  return `
    <li id="recurso-${r.id}" ${e !== 'visible' ? 'data-no-publicado' : ''} class="scroll-mt-8 border-t border-line py-4 first:border-0">
      <div class="flex items-start gap-3.5">
        <span class="grid size-10 shrink-0 place-items-center rounded-xl ${{ visible: 'bg-[#f1f2f5]', oculto: 'bg-[#f1f2f5] text-[#8a909a]', programado: 'border-2 border-dashed border-[#9aa1ad]' }[e]}">${icono(ICONO_TIPO[r.tipo])}</span>
        <div class="min-w-0 flex-1">
          <p class="font-semibold ${e === 'oculto' ? 'line-through decoration-2' : ''}">${esc(r.titulo)}</p>
          <p class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
            <span>${NOMBRE_TIPO[r.tipo]}</span>
            ${r.archivoNombre ? `<span>· ${esc(r.archivoNombre)} (${tamano(r.archivoBytes ?? 0)})</span>` : ''}
            ${sello ? `<span aria-hidden="true">·</span>${sello}` : ''}
          </p>
          ${r.contenidoMd ? `
            <details class="group mt-2">
              <summary class="inline-flex cursor-pointer list-none items-center gap-1 font-semibold underline-offset-4 hover:underline">
                <span class="transition-transform group-open:rotate-180">${icono('abajo', 'size-4')}</span>${r.tipo === 'apunte' ? 'Leer apunte' : 'Ver enunciado'}
              </summary>
              <div class="prosa mt-3">${markdown(r.contenidoMd)}</div>
            </details>` : ''}
        </div>
        <div class="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
          ${r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener" class="btn btn-secundario px-3 py-2 text-sm" aria-label="Abrir ${esc(r.titulo)} en otra pestaña"><span class="hidden sm:inline">Abrir</span>${icono('externo', 'size-4')}</a>` : ''}
          ${r.archivoNombre ? `<a href="/api/recursos/${r.id}/archivo" class="btn btn-secundario px-3 py-2 text-sm" aria-label="Descargar ${esc(r.archivoNombre)}">${icono('descargar', 'size-4')}<span class="hidden sm:inline">Descargar</span></a>` : ''}
          ${editable ? `
            <span class="flex gap-0.5" data-solo-profe>
              <button data-accion="editar-recurso" data-id="${r.id}" class="btn btn-texto" aria-label="Editar ${esc(r.titulo)}">${icono('editar', 'size-4')}</button>
              <button data-accion="borrar-recurso" data-id="${r.id}" data-confirmar="¿Borrar?" class="btn btn-texto" aria-label="Borrar ${esc(r.titulo)}">${icono('borrar', 'size-4')}</button>
            </span>` : ''}
        </div>
      </div>
      <div id="editar-${r.id}"></div>
    </li>`
}

/** Formulario de crear o editar un recurso. Los campos de URL y Markdown aparecen según el tipo (con CSS :has). */
function formRecurso(temaId: number, r?: Recurso) {
  const e = r ? estado(r) : 'visible'
  const desde = r?.visibleDesde ? fechaLocal(new Date(r.visibleDesde)) : ''
  const radio = (name: string, value: string, label: string, checked: boolean, extra = '') => `
    <label class="cursor-pointer">
      <input type="radio" name="${name}" value="${value}" ${checked ? 'checked' : ''} class="peer sr-only">
      <span class="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 font-semibold shadow-[inset_0_0_0_1.5px_#cfd4da] peer-checked:bg-ink peer-checked:text-white peer-checked:shadow-none peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink">${extra}${label}</span>
    </label>`

  return `
    <form data-form="recurso" ${r ? `data-id="${r.id}"` : `data-tema="${temaId}"`} class="group mt-4 space-y-5 rounded-xl bg-[#f5f6f8] p-5">
      <fieldset>
        <legend class="font-semibold">Tipo</legend>
        <div class="mt-2 flex flex-wrap gap-2">${TIPOS.map(([v, l]) => radio('tipo', v, l, (r?.tipo ?? 'apunte') === v, icono(ICONO_TIPO[v], 'size-4'))).join('')}</div>
      </fieldset>
      <label class="block font-semibold">Título<input name="titulo" required value="${esc(r?.titulo ?? '')}" class="campo"></label>
      <label class="block font-semibold group-has-[[value=apunte]:checked]:hidden">URL<input name="url" type="url" value="${esc(r?.url ?? '')}" placeholder="https://" class="campo"></label>
      <label class="block font-semibold group-has-[[value=video]:checked]:hidden group-has-[[value=enlace]:checked]:hidden">Contenido <span class="font-normal text-muted">(Markdown: ## títulos, **negrita**, \`código\`, listas)</span>
        <textarea name="contenidoMd" rows="6" class="campo font-mono text-sm">${esc(r?.contenidoMd ?? '')}</textarea>
      </label>
      <div>
        <label class="block font-semibold">Archivo <span class="font-normal text-muted">(opcional: PDF, imágenes, ZIP o código; máx. 20 MB)</span>
          <input name="archivo" type="file" accept="${ACEPTA}" class="mt-2 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-ink file:px-3 file:py-2 file:font-semibold file:text-white">
        </label>
        ${r?.archivoNombre ? `<label class="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" name="quitarArchivo" class="accent-ink">Quitar el archivo actual (${esc(r.archivoNombre)})</label>` : ''}
      </div>
      <fieldset>
        <legend class="font-semibold">¿Quién lo ve?</legend>
        <div class="mt-2 flex flex-wrap gap-2">
          ${radio('visibilidad', 'visible', 'Toda la clase, ya', e === 'visible')}
          ${radio('visibilidad', 'programado', 'Programar', e === 'programado', icono('reloj', 'size-4'))}
          ${radio('visibilidad', 'oculto', 'Solo yo (oculto)', e === 'oculto', icono('oculto', 'size-4'))}
        </div>
        <label class="mt-3 hidden max-w-xs font-semibold group-has-[[value=programado]:checked]:block">Se publica el<input name="desde" type="datetime-local" value="${desde}" class="campo"></label>
      </fieldset>
      <p data-error role="alert" class="text-sm font-medium text-danger empty:hidden"></p>
      <div class="flex gap-2">
        <button class="btn btn-primario">${r ? 'Guardar cambios' : 'Publicar recurso'}</button>
        <button type="button" data-accion="cancelar" class="btn btn-texto">Cancelar</button>
      </div>
    </form>`
}

/** Mostrar/ocultar un formulario y llevar el foco a su primer campo. */
function alternar(form: HTMLElement) {
  form.hidden = !form.hidden
  if (!form.hidden) form.querySelector<HTMLInputElement>('input')?.focus()
}
