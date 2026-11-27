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
export function pegatina(a: Asig, { href, grande = false, sub }: { href?: string; grande?: boolean; sub?: string } = {}) {
  const tag = href ? 'a' : 'span'
  const tam = grande ? 'px-4 py-3 text-2xl sm:px-5 sm:py-4 sm:text-3xl' : 'px-4 py-3 text-lg'
  // En móvil solo se ven las siglas (caben varias por fila); el nombre sigue ahí para lectores de pantalla
  return `<${tag} ${href ? `href="${href}"` : ''} class="sticker ${tam}" style="background:${vinilo(a.id)};transform:rotate(${giro(a.id)}deg);border-radius:${troquel(a.id)}" title="${esc(a.nombre)}">
      ${esc(siglas(a.nombre))}${sub ? `<span class="sr-only max-w-36 font-sans text-xs font-medium leading-snug opacity-85 sm:not-sr-only sm:mt-1.5 sm:block">${esc(sub)}</span>` : ''}
    </${tag}>`
}

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
