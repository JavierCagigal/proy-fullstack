// La clase: cada persona con su GitHub, su bio y "su portátil" con las pegatinas que ha ganado.
import { api } from '../api'
import { esc, html } from '../html'
import { type Params } from '../router'
import { setUsuario, usuario, type Usuario } from '../session'
import { avatar, cuando, icono, tapa } from '../ui'

type Persona = { id: number; nombre: string; rol: 'profesor' | 'alumno'; githubUsername: string | null; avatarUrl: string | null; bio: string | null; retos: string[]; tecnologias: string[]; asignaturas: { id: number; nombre: string }[] }
type Perfil = Omit<Persona, 'retos' | 'tecnologias'> & {
  equipos: { nombre: string; repoUrl: string | null; demoUrl: string | null; entregadoEn: string | null; reto: { id: number; titulo: string; fin: string } }[]
  propuestas: { id: number; titulo: string; tecnologias: string[]; estado: string }[]
}

const github = (u: string) => `<a href="https://github.com/${esc(u)}" target="_blank" rel="noopener" class="font-semibold underline">@${esc(u)}</a>`

export async function clasePage() {
  const personas = await api<Persona[]>('/clase')
  const grupo = (titulo: string, lista: Persona[]) => lista.length ? `
    <section aria-labelledby="g-${titulo}">
      <h2 id="g-${titulo}" class="font-display text-2xl font-extrabold">${titulo} <span class="font-sans text-base font-normal text-muted">(${lista.length})</span></h2>
      <ul class="mt-4 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        ${lista.map((p) => `
          <li>
            <a href="/clase/${p.id}" class="group block">
              ${tapa([...p.retos, ...p.tecnologias], { max: 5, asignaturas: p.asignaturas })}
              <span class="mt-3 flex items-center gap-3">
                ${avatar(p.nombre, 'size-9 text-base', p.avatarUrl)}
                <span class="min-w-0">
                  <span class="block truncate font-semibold group-hover:underline">${esc(p.nombre)}</span>
                  <span class="block truncate text-sm text-muted">${p.githubUsername ? `@${esc(p.githubUsername)}` : p.rol}</span>
                </span>
              </span>
            </a>
          </li>`).join('')}
      </ul>
    </section>` : ''

  const alumnos = personas.filter((p) => p.rol === 'alumno')
  return html(`
    <div class="space-y-10">
      <header>
        <h1 class="font-display text-4xl font-extrabold tracking-tight">La clase</h1>
        <p class="mt-2 text-lg text-muted">Cada portátil lleva sus pegatinas: las asignaturas que imparte, los retos en los que ha participado y las tecnologías de sus propuestas.</p>
      </header>
      ${grupo('Profesores', personas.filter((p) => p.rol === 'profesor'))}
      ${grupo('Alumnos', alumnos)}
      ${!personas.length ? '<p class="panel p-6 text-muted">Todavía no hay nadie en la clase.</p>' : ''}
    </div>`)
}

export async function perfilPage({ id }: Params) {
  const el = html(`<div></div>`)
  const pintar = async () => {
    const p = await api<Perfil>(`/clase/${id}`)
    el.innerHTML = vista(p, usuario()!.id === p.id)
  }
  try {
    await pintar()
  } catch {
    return html(`<div class="space-y-4"><h1 class="font-display text-3xl font-extrabold">Esa persona no está en la clase</h1><a href="/clase" class="font-semibold underline">Volver a la clase</a></div>`)
  }

  el.addEventListener('click', (e) => {
    if (!(e.target as Element).closest('[data-editar]')) return
    const form = el.querySelector<HTMLFormElement>('#editar-perfil')!
    form.hidden = !form.hidden
    if (!form.hidden) form.querySelector('input')!.focus()
  })
  el.addEventListener('submit', async (e) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    try {
      setUsuario(await api<Usuario>('/me', { method: 'PATCH', body: JSON.stringify(Object.fromEntries(new FormData(form))) }))
      await pintar()
    } catch (err) {
      form.querySelector('[data-error]')!.textContent = (err as Error).message
    }
  })
  return el
}

function vista(p: Perfil, esMio: boolean) {
  const pegatinas = [...new Set([...p.equipos.map((e) => e.reto.titulo), ...p.propuestas.flatMap((x) => x.tecnologias)])]
  return `
    <div class="space-y-8">
      <a href="/clase" class="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"><span class="rotate-180">${icono('flecha', 'size-4')}</span>La clase</a>
      <header class="flex flex-wrap items-center gap-x-6 gap-y-4">
        ${avatar(p.nombre, 'size-20 text-4xl', p.avatarUrl)}
        <div class="min-w-[min(100%,18rem)] flex-1">
          <h1 class="font-display text-4xl font-extrabold tracking-tight">${esc(p.nombre)}</h1>
          <p class="mt-1.5 text-lg text-muted">${p.rol === 'profesor' ? 'Profesor' : 'Alumno'}${p.githubUsername ? ` · ${github(p.githubUsername)}` : ''}</p>
          ${p.bio ? `<p class="mt-3 max-w-prose text-lg">${esc(p.bio)}</p>` : esMio ? '<p class="mt-3 text-muted">Aún no has escrito tu bio.</p>' : ''}
        </div>
        ${esMio ? `
          <div class="flex flex-wrap gap-2">
            ${usuario()!.githubId ? '' : `<a href="/api/auth/github" class="btn btn-secundario">${icono('github', 'size-4')}Conectar con GitHub</a>`}
            <button data-editar class="btn btn-secundario" aria-controls="editar-perfil">${icono('editar', 'size-4')}Editar perfil</button>
          </div>` : ''}
      </header>

      ${esMio ? `
        <form id="editar-perfil" hidden class="panel grid gap-4 p-6 sm:grid-cols-2">
          <label class="block font-semibold">Nombre<input name="nombre" required value="${esc(p.nombre)}" class="campo"></label>
          <label class="block font-semibold">Usuario de GitHub<input name="githubUsername" value="${esc(p.githubUsername ?? '')}" placeholder="tu-usuario" autocomplete="username" class="campo"></label>
          <label class="block font-semibold sm:col-span-2">Bio <span class="font-normal text-muted">(máx. 280)</span><textarea name="bio" maxlength="280" rows="3" class="campo">${esc(p.bio ?? '')}</textarea></label>
          <p data-error role="alert" class="text-sm font-medium text-danger empty:hidden sm:col-span-2"></p>
          <div><button class="btn btn-primario">Guardar</button></div>
        </form>` : ''}

      <section aria-labelledby="portatil">
        <h2 id="portatil" class="font-display text-2xl font-extrabold">${esMio ? 'Tu portátil' : 'Su portátil'}</h2>
        <div class="mt-4">${tapa(pegatinas, { grande: true, asignaturas: p.asignaturas })}</div>
      </section>

      <div class="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
        <section class="panel p-6" aria-labelledby="proyectos">
          <h2 id="proyectos" class="font-display text-xl font-extrabold">Proyectos en retos</h2>
          ${p.equipos.length ? `<ul class="mt-3">${p.equipos.map((e) => `
            <li class="border-t border-line py-3.5 first:border-0">
              <a href="/retos/${e.reto.id}" class="font-semibold hover:underline">${esc(e.reto.titulo)}</a>
              <p class="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted">
                <span>Equipo ${esc(e.nombre)}</span><span aria-hidden="true">·</span>
                ${e.entregadoEn ? `<span>entregado ${cuando(e.entregadoEn)}</span>
                  ${e.repoUrl ? `<a href="${esc(e.repoUrl)}" target="_blank" rel="noopener" class="font-semibold text-ink underline">Repo</a>` : ''}
                  ${e.demoUrl ? `<a href="${esc(e.demoUrl)}" target="_blank" rel="noopener" class="font-semibold text-ink underline">Demo</a>` : ''}` : '<span>sin entregar</span>'}
              </p>
            </li>`).join('')}</ul>` : `<p class="mt-3 text-muted">${esMio ? 'Aún no has participado en ningún reto.' : 'Aún no ha participado en ningún reto.'} <a href="/retos" class="font-semibold text-ink underline">Ver retos</a></p>`}
        </section>
        <section class="panel p-6" aria-labelledby="sus-propuestas">
          <h2 id="sus-propuestas" class="font-display text-xl font-extrabold">Propuestas</h2>
          ${p.propuestas.length ? `<ul class="mt-3">${p.propuestas.map((x) => `
            <li class="border-t border-line py-3.5 first:border-0">
              <a href="/propuestas" class="font-semibold hover:underline">${esc(x.titulo)}</a>
              <p class="mt-1 text-sm text-muted">${x.estado === 'aprobada' ? 'Aprobada' : x.estado === 'descartada' ? 'Descartada' : 'Abierta'}${x.tecnologias.length ? ` · ${x.tecnologias.map(esc).join(', ')}` : ''}</p>
            </li>`).join('')}</ul>` : '<p class="mt-3 text-muted">Ninguna todavía.</p>'}
        </section>
      </div>
    </div>`
}
