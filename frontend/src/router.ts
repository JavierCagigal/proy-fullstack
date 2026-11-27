// Router SPA propio sobre la History API (el enunciado prohíbe librerías de routing).

export type Params = Record<string, string>
export type Page = (params: Params) => HTMLElement | Promise<HTMLElement>
export type Routes = Record<string, Page> // '/asignaturas/:id' → página

/** Busca la ruta que encaja con el path y extrae los parámetros (:id). */
export function match(routes: Routes, path: string): { page: Page; params: Params } | null {
  const parts = path.split('/').filter(Boolean)
  for (const [pattern, page] of Object.entries(routes)) {
    const pp = pattern.split('/').filter(Boolean)
    if (pp.length !== parts.length) continue
    const params: Params = {}
    if (pp.every((p, i) => (p.startsWith(':') ? ((params[p.slice(1)] = decodeURIComponent(parts[i])), true) : p === parts[i]))) {
      return { page, params }
    }
  }
  return null
}

/** Devuelve otra ruta para redirigir (p. ej. a /login sin sesión) o null para dejar pasar. */
export type Guard = (path: string) => string | null

type Router = { navigate: (path: string) => Promise<void>; render: () => Promise<void> }
let current: Router | undefined
/** Navegación desde código (p. ej. tras el login). Usa el router de la app. */
export const navigate = (path: string) => current?.navigate(path)

export function createRouter(routes: Routes, notFound: Page, outlet: HTMLElement, guard: Guard = () => null): Router {
  async function render() {
    const redirect = guard(location.pathname)
    if (redirect && redirect !== location.pathname) history.replaceState(null, '', redirect)
    const found = match(routes, location.pathname)
    outlet.replaceChildren(await (found ? found.page(found.params) : notFound({})))
  }

  function navigate(path: string) {
    if (path !== location.pathname + location.search) history.pushState(null, '', path)
    return render()
  }

  // Intercepta los clics en enlaces internos para no recargar la página
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest?.('a')
    if (!a || a.origin !== location.origin || a.target || e.metaKey || e.ctrlKey || e.shiftKey) return
    e.preventDefault()
    navigate(a.pathname + a.search)
  })
  window.addEventListener('popstate', render)

  return (current = { navigate, render })
}
