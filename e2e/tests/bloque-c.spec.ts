import { expect, test } from '@playwright/test'
import { entrar } from './helpers'

const salir = async (page: import('@playwright/test').Page) => {
  await page.getByRole('button', { name: 'Salir', exact: true }).click()
  await expect(page).toHaveURL('/login')
}

test('hackathon: el profe lanza un reto, una alumna forma equipo y entrega, y otro alumno la vota', async ({ page }) => {
  const reto = `Reto E2E ${crypto.randomUUID().slice(0, 6)}`
  const equipo = `Equipo ${crypto.randomUUID().slice(0, 6)}`

  await entrar(page, 'ana@dawhub.dev')
  await page.getByRole('link', { name: 'Retos', exact: true }).click()
  await page.getByRole('button', { name: 'Nuevo reto' }).click()
  await page.getByLabel('Título').fill(reto)
  await page.getByLabel(/Descripción/).fill('Construid **algo** en una tarde.')
  await page.getByLabel('Personas por equipo').fill('2')
  await page.getByRole('button', { name: 'Publicar reto' }).click()
  await expect(page.getByRole('heading', { name: reto })).toBeVisible()
  const url = page.url()
  await salir(page)

  // Lucía crea equipo y entrega
  await entrar(page, 'lucia@dawhub.dev')
  await page.goto(url)
  await page.getByLabel('Nombre del equipo').fill(equipo)
  await page.getByRole('button', { name: 'Crear equipo' }).click()
  await expect(page.getByText('¡Estás dentro!')).toBeVisible()
  await page.getByLabel('Repositorio').fill('https://github.com/commit/e2e')
  await page.getByRole('button', { name: 'Entregar repo y demo' }).click()
  await expect(page.getByText(/Entregado/)).toBeVisible()
  await salir(page)

  // Pablo la vota (y no puede votarse a sí mismo porque no tiene equipo entregado)
  await entrar(page, 'pablo@dawhub.dev')
  await page.goto(url)
  const fila = page.getByRole('listitem').filter({ hasText: equipo })
  await fila.getByRole('button', { name: 'Votar' }).click()
  await expect(fila.getByRole('button', { name: 'Tu voto' })).toHaveAttribute('aria-pressed', 'true')
  await salir(page)

  // La profe ve el voto (los alumnos, al cerrar) y borra el reto
  await entrar(page, 'ana@dawhub.dev')
  await page.goto(url)
  await expect(page.getByRole('listitem').filter({ hasText: equipo }).getByText('1 voto')).toBeVisible()
  await page.getByRole('button', { name: 'Borrar reto' }).click()
  await page.getByRole('button', { name: '¿Borrar el reto? Pulsa otra vez' }).click()
  await expect(page).toHaveURL('/retos')
})

test('notas: la profe pone una nota en el cuaderno y la alumna la ve en las suyas', async ({ page }) => {
  // Nota distinta en cada ejecución: si coincide con la que ya hay, el navegador no lanza "change"
  const valor = `${1 + Math.floor(Math.random() * 9)}.${1 + Math.floor(Math.random() * 9)}` // p. ej. 7.3 (nunca 7.0, que se mostraría "7")
  await entrar(page, 'ana@dawhub.dev')
  await page.getByRole('link', { name: 'Notas', exact: true }).click()
  await page.getByRole('combobox', { name: 'Asignatura' }).selectOption({ label: 'Desarrollo Web en Entorno Cliente' })
  const casilla = page.getByLabel('Nota de Lucía en Práctica SPA')
  await casilla.fill(valor)
  await casilla.blur()
  await expect(page.getByRole('status')).toHaveText('Guardado')
  await salir(page)

  await entrar(page, 'lucia@dawhub.dev')
  await page.getByRole('link', { name: 'Notas', exact: true }).click()
  await expect(page.getByRole('row', { name: /Práctica SPA/ }).getByText(valor.replace('.', ','))).toBeVisible()
  await salir(page)

  // Limpieza: la profe quita la nota
  await entrar(page, 'ana@dawhub.dev')
  await page.goto('/notas')
  await page.getByRole('combobox', { name: 'Asignatura' }).selectOption({ label: 'Desarrollo Web en Entorno Cliente' })
  await page.getByLabel('Nota de Lucía en Práctica SPA').fill('')
  await page.getByLabel('Nota de Lucía en Práctica SPA').blur()
  await expect(page.getByRole('status')).toHaveText('Guardado')
})

test('ofertas: la de un alumno queda pendiente hasta que la aprueba un profesor', async ({ page }) => {
  const puesto = `Prácticas E2E ${crypto.randomUUID().slice(0, 6)}`
  await entrar(page, 'lucia@dawhub.dev')
  await page.getByRole('link', { name: 'Ofertas', exact: true }).click()
  await page.getByRole('button', { name: 'Compartir oferta' }).click()
  await page.getByLabel('Puesto').fill(puesto)
  await page.getByLabel('Empresa').fill('Acme')
  await page.getByLabel('Enlace a la oferta').fill('https://acme.dev/practicas')
  await page.getByRole('button', { name: 'Publicar' }).click()
  const fila = page.getByRole('listitem').filter({ hasText: puesto })
  await expect(fila.getByText('Pendiente de aprobar')).toBeVisible()
  await salir(page)

  await entrar(page, 'ana@dawhub.dev')
  await page.goto('/ofertas')
  const deAna = page.getByRole('listitem').filter({ hasText: puesto })
  await deAna.getByRole('button', { name: 'Aprobar' }).click()
  await expect(deAna.getByText('Pendiente de aprobar')).toHaveCount(0)
  // Limpieza
  await deAna.getByRole('button', { name: `Borrar la oferta ${puesto}` }).click()
  await deAna.getByRole('button', { name: '¿Borrar?' }).click()
  await expect(page.getByRole('listitem').filter({ hasText: puesto })).toHaveCount(0)
})
