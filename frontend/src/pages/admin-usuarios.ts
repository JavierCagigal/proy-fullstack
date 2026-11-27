import { api } from '../api'
import { esc, html } from '../html'
import { confirmado, icono } from '../ui'
import { usuario, type Rol, type Usuario } from '../session'

const ROLES: Rol[] = ['alumno', 'profesor', 'admin']
const COLOR_ROL: Record<Rol, string> = { alumno: 'var(--color-sky)', profesor: 'var(--color-lemon)', admin: 'var(--color-tomato)' }

// Gestión de roles. El frontend solo oculta; quien protege es el backend (403 si no eres admin).
export async function adminUsuariosPage() {
  if (usuario()?.rol !== 'admin') return html(`<p class="panel p-6 font-medium">Solo los administradores pueden gestionar usuarios.</p>`)

  const usuarios = await api<Usuario[]>('/admin/usuarios')
  const cuenta = (r: Rol) => usuarios.filter((u) => u.rol === r).length
  const el = html(`
    <div class="space-y-8">
      <header>
        <h1 class="font-display text-4xl font-extrabold tracking-tight">Usuarios</h1>
        <p class="mt-2 text-lg text-muted">${cuenta('alumno')} alumnos, ${cuenta('profesor')} profesores y ${cuenta('admin')} admins. Quien se registra entra como alumno; aquí le cambias el rol.</p>
      </header>
      <p data-msg role="status" class="font-medium empty:hidden"></p>
      <div class="panel overflow-x-auto">
        <table class="w-full text-left">
          <thead class="text-sm text-muted"><tr><th class="px-6 py-3 font-semibold">Nombre</th><th class="px-6 py-3 font-semibold">Email</th><th class="px-6 py-3 font-semibold">Rol</th><th class="px-6 py-3"><span class="sr-only">Acciones</span></th></tr></thead>
          <tbody>
            ${usuarios.map((u) => `
              <tr class="border-t border-line">
                <td class="px-6 py-3.5 font-semibold">
                  <span class="flex items-center gap-3"><span aria-hidden="true" data-avatar="${u.id}" class="grid size-8 place-items-center rounded-full border-2 border-white font-display font-extrabold shadow-[0_0_0_1px_#d9dde3]" style="background:${COLOR_ROL[u.rol]}">${esc(u.nombre[0]?.toUpperCase())}</span>${esc(u.nombre)}</span>
                </td>
                <td class="px-6 py-3.5 text-muted">${esc(u.email)}</td>
                <td class="px-6 py-3.5">
                  <select data-id="${u.id}" aria-label="Rol de ${esc(u.nombre)}" class="campo mt-0 w-36 py-1.5" ${u.id === usuario()!.id ? 'disabled title="No puedes cambiar tu propio rol"' : ''}>
                    ${ROLES.map((r) => `<option ${r === u.rol ? 'selected' : ''}>${r}</option>`).join('')}
                  </select>
                </td>
                <td class="px-6 py-3.5 text-right">
                  ${u.id === usuario()!.id ? '' : `<button data-borrar="${u.id}" data-confirmar="¿Borrar a ${esc(u.nombre)}?" class="btn btn-texto" aria-label="Borrar a ${esc(u.nombre)}">${icono('borrar', 'size-4')}</button>`}
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`)

  const msg = el.querySelector<HTMLElement>('[data-msg]')!
  el.addEventListener('click', async (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('[data-borrar]')
    if (!b || !confirmado(b)) return
    const u = usuarios.find((x) => x.id === Number(b.dataset.borrar))!
    try {
      await api(`/admin/usuarios/${u.id}`, { method: 'DELETE' })
      b.closest('tr')!.remove()
      msg.className = 'font-medium text-ok'
      msg.textContent = `${u.nombre} se ha borrado.`
    } catch (err) {
      msg.className = 'font-medium text-danger'
      msg.textContent = (err as Error).message
    }
  })
  el.addEventListener('change', async (e) => {
    const select = e.target as HTMLSelectElement
    const u = usuarios.find((x) => x.id === Number(select.dataset.id))!
    try {
      await api(`/admin/usuarios/${u.id}`, { method: 'PATCH', body: JSON.stringify({ rol: select.value }) })
      u.rol = select.value as Rol
      el.querySelector<HTMLElement>(`[data-avatar="${u.id}"]`)!.style.background = COLOR_ROL[u.rol]
      msg.className = 'font-medium text-ok'
      msg.textContent = `${u.nombre} ahora es ${u.rol}.`
    } catch (err) {
      select.value = u.rol
      msg.className = 'font-medium text-danger'
      msg.textContent = (err as Error).message
    }
  })
  return el
}
