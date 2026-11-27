import { api } from '../api'
import { esc, html } from '../html'
import { usuario, type Rol, type Usuario } from '../session'

const ROLES: Rol[] = ['alumno', 'profesor', 'admin']

// Gestión de roles. El frontend solo oculta; quien protege es el backend (403 si no eres admin).
export async function adminUsuariosPage() {
  if (usuario()?.rol !== 'admin') return html(`<p class="text-red-600">Solo los administradores pueden gestionar usuarios.</p>`)

  const usuarios = await api<Usuario[]>('/admin/usuarios')
  const el = html(`
    <section class="space-y-4">
      <h1 class="text-2xl font-bold">Usuarios</h1>
      <p data-msg role="status" class="text-sm"></p>
      <table class="w-full overflow-hidden rounded bg-white text-left text-sm shadow-sm">
        <thead class="bg-slate-100"><tr><th class="p-2">Nombre</th><th class="p-2">Email</th><th class="p-2">Rol</th></tr></thead>
        <tbody>
          ${usuarios.map((u) => `
            <tr class="border-t">
              <td class="p-2">${esc(u.nombre)}</td>
              <td class="p-2">${esc(u.email)}</td>
              <td class="p-2">
                <select data-id="${u.id}" aria-label="Rol de ${esc(u.nombre)}" class="rounded border px-2 py-1" ${u.id === usuario()!.id ? 'disabled' : ''}>
                  ${ROLES.map((r) => `<option ${r === u.rol ? 'selected' : ''}>${r}</option>`).join('')}
                </select>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </section>`)

  const msg = el.querySelector<HTMLElement>('[data-msg]')!
  el.addEventListener('change', async (e) => {
    const select = e.target as HTMLSelectElement
    const u = usuarios.find((x) => x.id === Number(select.dataset.id))!
    try {
      await api(`/admin/usuarios/${u.id}`, { method: 'PATCH', body: JSON.stringify({ rol: select.value }) })
      u.rol = select.value as Rol
      msg.className = 'text-sm text-green-700'
      msg.textContent = `${u.nombre} ahora es ${u.rol}.`
    } catch (err) {
      select.value = u.rol
      msg.className = 'text-sm text-red-600'
      msg.textContent = (err as Error).message
    }
  })
  return el
}
