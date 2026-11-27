// Markdown mínimo y seguro para los apuntes: se escapa TODO primero y luego se añaden solo etiquetas conocidas.
// Admite: ## títulos, listas (- y 1.), ```bloques de código```, `código`, **negrita**, *cursiva* y [enlaces](https://…).
import { esc } from './html'

const LISTA = /^\s*([-*]|\d+\.)\s+/

export function markdown(src: string): string {
  const lineas = src.replace(/\r\n?/g, '\n').split('\n')
  const html: string[] = []
  let i = 0
  while (i < lineas.length) {
    const linea = lineas[i]
    if (linea.startsWith('```')) {
      const codigo: string[] = []
      for (i++; i < lineas.length && !lineas[i].startsWith('```'); i++) codigo.push(lineas[i])
      i++
      html.push(`<pre><code>${esc(codigo.join('\n'))}</code></pre>`)
    } else if (/^#{1,4}\s/.test(linea)) {
      // # del apunte → h2, porque el h1 es el de la página
      const nivel = Math.min(linea.indexOf(' ') + 1, 4)
      html.push(`<h${nivel}>${enLinea(linea.replace(/^#+\s+/, ''))}</h${nivel}>`)
      i++
    } else if (LISTA.test(linea)) {
      const tag = /^\s*\d/.test(linea) ? 'ol' : 'ul'
      const items: string[] = []
      while (i < lineas.length && LISTA.test(lineas[i])) items.push(`<li>${enLinea(lineas[i++].replace(LISTA, ''))}</li>`)
      html.push(`<${tag}>${items.join('')}</${tag}>`)
    } else if (linea.trim()) {
      const parrafo: string[] = []
      while (i < lineas.length && lineas[i].trim() && !/^(```|#{1,4}\s)/.test(lineas[i]) && !LISTA.test(lineas[i])) parrafo.push(lineas[i++])
      html.push(`<p>${enLinea(parrafo.join(' '))}</p>`)
    } else {
      i++
    }
  }
  return html.join('')
}

/** Formato dentro de una línea. El código entre ` no se toca. */
function enLinea(texto: string) {
  return esc(texto)
    .split(/(`[^`]+`)/)
    .map((trozo) =>
      trozo.length > 2 && trozo.startsWith('`') && trozo.endsWith('`')
        ? `<code>${trozo.slice(1, -1)}</code>`
        : trozo
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            // Solo enlaces http(s): nada de javascript:
            .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>'),
    )
    .join('')
}
