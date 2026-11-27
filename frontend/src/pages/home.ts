import { api } from '../api'
import { esc, html } from '../html'
import { usuario } from '../session'
import { chip, cuando, fechaCorta, icono, pegatina, type Icono } from '../ui'

type Asignatura = { id: number; nombre: string; curso: string }
type Panel = {
  proximas: { id: number; titulo: string; tipo: 'examen' | 'practica' | 'proyecto'; fecha: string; asignatura: Asignatura }[]
  retos: { id: number; titulo: string; fin: string; maxMiembros: number; _count: { equipos: number }; equipos: { nombre: string; _count: { miembros: number } }[] }[]
  recientes: { id: number; tipo: Icono; titulo: string; creadoEn: string; autor: { nombre: string }; tema: { asignatura: Asignatura } }[]
}

const TIPO_EVALUACION = { examen: 'Examen', practica: 'Práctica', proyecto: 'Proyecto' }
const TIPO_RECURSO: Record<string, string> = { apunte: 'apunte', video: 'vídeo', enlace: 'enlace', proyecto: 'proyecto' }

// "Hoy": lo próximo primero (PRODUCT.md, principio 1)
export async function homePage() {
  const [panel, asignaturas] = await Promise.all([api<Panel>('/panel'), api<Asignatura[]>('/asignaturas')])
  const hoy = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric' }).format(new Date())
  const reto = panel.retos[0]

  return html(`
    <div class="space-y-8">
      <header>
        <h1 class="font-display text-4xl font-extrabold tracking-tight lg:text-[44px]">Hoy, ${hoy}</h1>
        <p class="mt-2 text-lg text-muted">${resumen(panel)}</p>
      </header>

      ${asignaturas.length ? `
        <nav aria-label="Tus asignaturas" class="-mx-1 flex flex-wrap items-center gap-4 px-1 py-1">
          ${asignaturas.map((a) => pegatina(a, { href: `/asignaturas/${a.id}`, sub: a.nombre })).join('')}
        </nav>` : ''}

      <div class="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section class="panel p-6" aria-labelledby="proximo">
          <h2 id="proximo" class="font-display text-xl font-extrabold">Lo próximo</h2>
          ${panel.proximas.length ? `
            <ul class="mt-3">
              ${panel.proximas.map((e) => `
                <li class="grid grid-cols-[84px_1fr] items-center gap-x-4 gap-y-1.5 border-t sm:grid-cols-[104px_1fr_auto] border-line py-3.5 first:border-0">
                  <time datetime="${e.fecha}" class="font-semibold">${fechaCorta(e.fecha)}<span class="block text-sm font-normal text-muted">${cuando(e.fecha)}</span></time>
                  <a href="/asignaturas/${e.asignatura.id}" class="flex min-w-0 items-center gap-2.5 hover:underline">${chip(e.asignatura)}<span class="sm:truncate">${esc(e.titulo)}</span></a>
                  <span class="col-start-2 justify-self-start rounded-full px-2.5 py-1 text-xs font-bold sm:col-start-auto ${e.tipo === 'examen' ? 'bg-danger-soft text-danger' : 'bg-[#f1f2f5] text-muted'}">${TIPO_EVALUACION[e.tipo]}</span>
                </li>`).join('')}
            </ul>` : '<p class="mt-3 text-muted">Nada en el horizonte. Buen momento para adelantar el proyecto.</p>'}

          <h2 class="mt-8 font-display text-xl font-extrabold">Últimos recursos</h2>
          ${panel.recientes.length ? `
            <ul class="mt-3">
              ${panel.recientes.map((r) => `
                <li class="border-t border-line first:border-0">
                  <a href="/asignaturas/${r.tema.asignatura.id}#recurso-${r.id}" class="flex items-center gap-3 py-3 hover:underline">
                    ${chip(r.tema.asignatura)}<span class="text-muted">${icono(r.tipo)}</span>
                    <span class="min-w-0 sm:truncate"><b class="font-semibold">${esc(r.titulo)}</b> <span class="text-muted">· ${TIPO_RECURSO[r.tipo]}</span></span>
                    <span class="ml-auto hidden shrink-0 text-sm text-muted sm:block">${esc(r.autor.nombre.split(' ')[0])} · ${cuando(r.creadoEn)}</span>
                  </a>
                </li>`).join('')}
            </ul>` : '<p class="mt-3 text-muted">Todavía no hay recursos publicados.</p>'}
        </section>

        <aside class="space-y-6">
          ${reto ? retoActivo(reto) : `
            <section class="panel p-6">
              <h2 class="font-display text-xl font-extrabold">Retos</h2>
              <p class="mt-2 text-muted">No hay ningún reto abierto ahora mismo.</p>
            </section>`}
        </aside>
      </div>
    </div>`)
}

function resumen({ proximas, retos }: Panel) {
  const partes: string[] = []
  const examen = proximas.find((e) => e.tipo === 'examen')
  if (examen) partes.push(`tienes un examen ${cuando(examen.fecha)}`)
  else if (proximas[0]) partes.push(`tu próxima entrega es ${cuando(proximas[0].fecha)}`)
  if (retos[0]) partes.push(`hay un reto abierto que acaba ${cuando(retos[0].fin)}`)
  const u = usuario()!
  if (!partes.length) return `Todo tranquilo, ${esc(u.nombre.split(' ')[0])}.`
  const frase = partes.join(' y ')
  return `${frase[0].toUpperCase()}${frase.slice(1)}.`
}

function retoActivo(reto: Panel['retos'][number]) {
  const ms = new Date(reto.fin).getTime() - Date.now()
  const dias = Math.floor(ms / 86_400_000)
  const horas = Math.floor((ms % 86_400_000) / 3_600_000)
  const minutos = Math.floor((ms % 3_600_000) / 60_000)
  // Con menos de un día, horas y minutos (un "0 días" no dice nada)
  const tiempo: [number, string][] = dias > 0
    ? [[dias, dias === 1 ? 'día' : 'días'], [horas, horas === 1 ? 'hora' : 'horas']]
    : [[horas, horas === 1 ? 'hora' : 'horas'], [minutos, minutos === 1 ? 'minuto' : 'minutos']]
  const equipo = reto.equipos[0]
  return `
    <section class="relative rounded-[14px] bg-ink p-6 text-white" aria-labelledby="reto">
      ${equipo ? '<span class="sticker absolute -top-3.5 right-5 rotate-6 bg-mint px-3 py-1.5 text-sm">¡Estás dentro!</span>' : ''}
      <h2 id="reto" class="font-display text-2xl font-extrabold leading-tight">${esc(reto.titulo)}</h2>
      <p class="mt-2 font-semibold text-lemon">Abierto hasta el ${fechaCorta(reto.fin)}</p>
      <p class="mt-1 text-rail-text">${equipo ? `Tu equipo: <b class="text-white">${esc(equipo.nombre)}</b> · ${equipo._count.miembros}/${reto.maxMiembros}` : 'Todavía no tienes equipo.'}</p>
      <dl class="mt-5 grid grid-cols-3 gap-2.5 text-center">
        ${[...tiempo, [reto._count.equipos, 'equipos']].map(([n, l]) => `
          <div class="flex flex-col-reverse rounded-[10px] bg-rail py-2.5"><dt class="text-xs text-rail-muted">${l}</dt><dd class="tabular font-display text-2xl font-extrabold">${n}</dd></div>`).join('')}
      </dl>
    </section>`
}
