import { api } from '../api'
import { esc, html } from '../html'
import { chip, cuando, fechaCorta } from '../ui'

type Evaluacion = { id: number; titulo: string; tipo: 'examen' | 'practica' | 'proyecto'; fecha: string; peso: number; asignatura: { id: number; nombre: string } }
type Reto = { id: number; titulo: string; inicio: string; fin: string; estado: string }

const TIPO = { examen: 'Examen', practica: 'Práctica', proyecto: 'Proyecto' }
const mes = (d: Date) => new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(d)

// Calendario: exámenes, entregas y cierres de retos, de lo más cercano a lo más lejano (lo próximo arriba)
export async function calendarioPage() {
  const [evaluaciones, retos] = await Promise.all([api<Evaluacion[]>('/evaluaciones'), api<Reto[]>('/retos')])
  const ahora = new Date()

  type Item = { fecha: Date; html: string }
  const items: Item[] = [
    ...evaluaciones.map((e) => ({
      fecha: new Date(e.fecha),
      html: `
        <a href="/asignaturas/${e.asignatura.id}" class="flex min-w-0 items-center gap-2.5 hover:underline">${chip(e.asignatura)}<span>${esc(e.titulo)} <span class="text-muted">· ${esc(e.asignatura.nombre)}</span></span></a>
        <span class="col-start-2 justify-self-start rounded-full px-2.5 py-1 text-xs font-bold sm:col-start-auto ${e.tipo === 'examen' ? 'bg-danger-soft text-danger' : 'bg-[#f1f2f5] text-muted'}">${TIPO[e.tipo]}</span>`,
    })),
    ...retos.map((r) => ({
      fecha: new Date(r.fin),
      html: `
        <a href="/retos/${r.id}" class="flex min-w-0 items-center gap-2.5 hover:underline"><span aria-hidden="true" class="inline-block size-3.5 shrink-0 rounded-[5px] bg-ink"></span><span>Cierre del reto: ${esc(r.titulo)}</span></a>
        <span class="col-start-2 justify-self-start rounded-full bg-ink px-2.5 py-1 text-xs font-bold text-white sm:col-start-auto">Reto</span>`,
    })),
  ].sort((a, b) => a.fecha.getTime() - b.fecha.getTime())

  const proximos = items.filter((i) => i.fecha >= ahora)
  const pasados = items.filter((i) => i.fecha < ahora).reverse()

  // Agrupar por mes
  const porMes = new Map<string, Item[]>()
  for (const i of proximos) porMes.set(mes(i.fecha), [...(porMes.get(mes(i.fecha)) ?? []), i])

  const fila = (i: Item, pasado = false) => `
    <li class="grid grid-cols-[84px_1fr] items-center gap-x-4 gap-y-1.5 border-t border-line py-3.5 first:border-0 sm:grid-cols-[110px_1fr_auto] ${pasado ? 'text-muted' : ''}">
      <time datetime="${i.fecha.toISOString()}" class="font-semibold">${fechaCorta(i.fecha)}<span class="block text-sm font-normal text-muted">${cuando(i.fecha)}</span></time>
      ${i.html}
    </li>`

  return html(`
    <div class="space-y-8">
      <header>
        <h1 class="font-display text-4xl font-extrabold tracking-tight">Calendario</h1>
        <p class="mt-2 text-lg text-muted">Exámenes, entregas y cierres de retos de todas las asignaturas.</p>
      </header>
      ${porMes.size ? [...porMes].map(([m, lista]) => `
        <section class="panel p-6" aria-labelledby="mes-${esc(m).replace(/\W/g, '')}">
          <h2 id="mes-${esc(m).replace(/\W/g, '')}" class="font-display text-xl font-extrabold first-letter:uppercase">${esc(m)}</h2>
          <ul class="mt-3">${lista.map((i) => fila(i)).join('')}</ul>
        </section>`).join('') : '<p class="panel p-6 text-muted">No hay nada por delante. Disfrútalo.</p>'}
      ${pasados.length ? `
        <details class="panel group p-6">
          <summary class="cursor-pointer list-none font-display text-xl font-extrabold">Ya pasado <span class="font-sans text-base font-normal text-muted">(${pasados.length})</span></summary>
          <ul class="mt-3">${pasados.map((i) => fila(i, true)).join('')}</ul>
        </details>` : ''}
    </div>`)
}
