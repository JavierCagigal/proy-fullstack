// Piezas de interfaz compartidas: pegatinas, iconos y formatos de fecha y tamaño.
import { esc } from './html'

// ── Pegatinas de asignatura ────────────────────────────────────────────────

const VINILOS = ['tomato', 'lemon', 'mint', 'lilac', 'pink', 'sky'] as const
const GIROS = [-2, 1.5, -1, 2.5, -2.5, 1]
// Cada asignatura tiene su troquel: rectángulo, píldora, esquinas cruzadas…
const TROQUELES = ['16px', '999px', '10px 26px', '26px 10px', '22px', '999px 16px 16px 999px']

/** Color fijo por asignatura (se deriva del id: no hace falta guardarlo en la BD). */
export const vinilo = (id: number) => `var(--color-${VINILOS[(id - 1 + VINILOS.length) % VINILOS.length]})`
const giro = (id: number) => GIROS[(id - 1 + GIROS.length) % GIROS.length]
const troquel = (id: number) => TROQUELES[(id - 1 + TROQUELES.length) % TROQUELES.length]

const VACIAS = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'en', 'y', 'e', 'a', 'para', 'con'])
/** "Desarrollo Web en Entorno Cliente" → "DWEC" */
export const siglas = (nombre: string) =>
  nombre.split(/\s+/).filter((p) => p && !VACIAS.has(p.toLowerCase())).map((p) => p[0].toUpperCase()).join('').slice(0, 5)

type Asig = { id: number; nombre: string }

/** Pegatina de una asignatura. `grande` para cabeceras; por defecto, la de los accesos de "Hoy". */
export function pegatina(a: Asig, { href, grande = false, sub, clase }: { href?: string; grande?: boolean; sub?: string; clase?: string } = {}) {
  const tag = href ? 'a' : 'span'
  const tam = clase ?? (grande ? 'px-4 py-3 text-2xl sm:px-5 sm:py-4 sm:text-3xl' : 'px-4 py-3 text-lg')
  // En móvil solo se ven las siglas (caben varias por fila); el nombre sigue ahí para lectores de pantalla
  return `<${tag} ${href ? `href="${href}"` : ''} class="sticker ${tam}" style="background:${vinilo(a.id)};transform:rotate(${giro(a.id)}deg);border-radius:${troquel(a.id)}" title="${esc(a.nombre)}">
      ${esc(siglas(a.nombre))}${sub ? `<span class="sr-only max-w-36 font-sans text-xs font-medium leading-snug opacity-85 sm:not-sr-only sm:mt-1.5 sm:block">${esc(sub)}</span>` : ''}
    </${tag}>`
}

/** Número estable a partir de un texto, para derivar color, giro y troquel de una pegatina libre. */
const semilla = (t: string) => [...t].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)

/** Pegatina de cualquier cosa que no es una asignatura: una tecnología, un reto, una categoría… */
export function pegatinaLibre(texto: string, clase = 'px-3 py-2 text-sm') {
  const h = semilla(texto.toLowerCase())
  return `<span class="sticker ${clase}" style="background:var(--color-${VINILOS[h % VINILOS.length]});transform:rotate(${GIROS[(h >> 3) % GIROS.length]}deg);border-radius:${TROQUELES[(h >> 5) % TROQUELES.length]}">${esc(texto)}</span>`
}

/** La tapa del portátil con las pegatinas que alguien ha ido ganando (retos, tecnologías…). */
export function tapa(pegatinas: string[], { max = 99, grande = false, asignaturas = [] as Asig[] } = {}) {
  const visibles = pegatinas.slice(0, Math.max(0, max - asignaturas.length))
  const resto = pegatinas.length - visibles.length
  const tam = grande ? 'px-4 py-2.5 text-base' : 'px-2.5 py-1.5 text-xs'
  return `
    <div class="flex flex-wrap content-start items-start gap-3 rounded-2xl bg-[#c7ccd3] ${grande ? 'min-h-48 p-6' : 'min-h-32 p-4'}">
      ${asignaturas.map((a) => pegatina(a, { clase: tam })).join('')}
      ${visibles.map((t) => pegatinaLibre(t, tam)).join('')}
      ${resto > 0 ? `<span class="self-center text-sm font-semibold text-ink">+${resto}</span>` : ''}
      ${pegatinas.length || asignaturas.length ? '' : '<span class="self-center text-sm font-medium text-[#3f4550]">Todavía sin pegatinas</span>'}
    </div>`
}

/** Foto de GitHub si la hay; si no, la inicial en un círculo neutro (el color saturado es solo de las pegatinas). */
export const avatar = (nombre: string, clase = 'size-9 text-base', url?: string | null) =>
  url && /^https:\/\//.test(url)
    ? `<img src="${esc(url)}" alt="" loading="lazy" class="${clase} shrink-0 rounded-full bg-ink object-cover">`
    : `<span aria-hidden="true" class="grid ${clase} shrink-0 place-items-center rounded-full bg-ink font-display font-extrabold text-white">${esc(nombre[0]?.toUpperCase() ?? '?')}</span>`

/** Muestra pequeña del color de la asignatura, para listas. */
export const chip = (a: Asig) =>
  `<span aria-hidden="true" class="inline-block size-3.5 shrink-0 rounded-[5px] border-2 border-white shadow-[0_0_0_1px_#d9dde3]" style="background:${vinilo(a.id)}"></span>`

// ── Iconos (trazos de Lucide, licencia ISC) ────────────────────────────────

const ICONOS = {
  apunte: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>',
  video: '<circle cx="12" cy="12" r="10"/><path d="m10 8 6 4-6 4Z"/>',
  enlace: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  proyecto: '<line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
  archivo: '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
  descargar: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  externo: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  oculto: '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><path d="m2 2 20 20"/>',
  reloj: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  mas: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  borrar: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  editar: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
  salir: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  hoy: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  asignaturas: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  usuarios: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  flecha: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  calendario: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  notas: '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
  retos: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  propuestas: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
  ofertas: '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  skills: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
  votar: '<path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>',
  github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
  lugar: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  abajo: '<path d="m6 9 6 6 6-6"/>',
} as const

export type Icono = keyof typeof ICONOS
export const icono = (nombre: Icono, clase = 'size-[18px]') =>
  `<svg class="${clase} shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS[nombre]}</svg>`

// ── Formatos ───────────────────────────────────────────────────────────────

const relativo = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })

/** "mañana", "en 3 días", "hace 2 horas"… */
export function cuando(fecha: string | Date, ahora = new Date()) {
  const ms = new Date(fecha).getTime() - ahora.getTime()
  const min = Math.round(ms / 60_000)
  const horas = Math.round(min / 60)
  const texto =
    Math.abs(min) < 60 ? relativo.format(min, 'minute')
    : Math.abs(horas) < 24 ? relativo.format(horas, 'hour')
    : relativo.format(Math.round(horas / 24), 'day')
  return texto.replace(/^dentro de /, 'en ')
}

/** "lun 1 dic" */
export const fechaCorta = (fecha: string | Date) =>
  new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(fecha)).replace(',', '')

/** "1 dic, 09:00" */
export const fechaHora = (fecha: string | Date) =>
  new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(fecha))

export function tamano(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`
}

/** Fecha en el formato de <input type="datetime-local">, en hora local. */
export const fechaLocal = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)

/** Nota con coma decimal: 7.5 → "7,5" */
export const nota = (n: number) => n.toLocaleString('es', { maximumFractionDigits: 2 })

/**
 * Borrar en dos pasos: el primer clic pide confirmación en el propio botón (sin diálogos del navegador).
 * Devuelve true cuando el usuario confirma. El botón lleva el texto de confirmación en data-confirmar.
 */
export function confirmado(b: HTMLButtonElement) {
  if (b.dataset.armado) return true
  const antes = b.innerHTML
  const etiqueta = b.getAttribute('aria-label')
  b.dataset.armado = '1'
  b.innerHTML = b.dataset.confirmar!
  if (etiqueta) b.setAttribute('aria-label', b.dataset.confirmar!) // que el lector de pantalla también lo anuncie
  b.classList.add('btn-peligro')
  setTimeout(() => {
    delete b.dataset.armado
    b.innerHTML = antes
    if (etiqueta) b.setAttribute('aria-label', etiqueta)
    b.classList.remove('btn-peligro')
  }, 4000)
  return false
}
