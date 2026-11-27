/** Crea un elemento a partir de HTML. Escapa siempre los datos de usuario con esc(). */
export function html(markup: string): HTMLElement {
  const t = document.createElement('template')
  t.innerHTML = markup.trim()
  return t.content.firstElementChild as HTMLElement
}

export const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
