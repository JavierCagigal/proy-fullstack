import { describe, expect, it } from 'vitest'
import { markdown } from './markdown'

describe('markdown', () => {
  it('convierte títulos, listas, código y formato en línea', () => {
    expect(markdown('# Tipos\n\nUsa **siempre** `const`.\n\n- uno\n- dos\n\n1. a')).toBe(
      '<h2>Tipos</h2><p>Usa <strong>siempre</strong> <code>const</code>.</p><ul><li>uno</li><li>dos</li></ul><ol><li>a</li></ol>',
    )
    expect(markdown('```ts\nconst a = 1 < 2\n```')).toBe('<pre><code>const a = 1 &#60; 2</code></pre>')
  })

  it('no deja pasar HTML ni enlaces javascript: (XSS)', () => {
    const html = markdown('<img src=x onerror=alert(1)> [clic](javascript:alert(1)) [ok](https://mdn.dev/a?b=1&c=2)')
    expect(html).not.toContain('<img')
    expect(html).not.toContain('href="javascript')
    expect(html).toContain('<a href="https://mdn.dev/a?b=1&#38;c=2" target="_blank" rel="noopener">ok</a>')
  })

  it('no interpreta formato dentro del código', () => {
    expect(markdown('`**no**`')).toBe('<p><code>**no**</code></p>')
  })
})
