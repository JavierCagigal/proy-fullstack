import { expect, test } from '@playwright/test'
import { entrar } from './helpers'

test('la clase: cada uno edita su perfil desde el menú y su GitHub aparece en la clase', async ({ page }) => {
  const bio = `Bio E2E ${crypto.randomUUID().slice(0, 6)}`
  await entrar(page, 'hugo@dawhub.dev')
  // El nombre del menú lleva a tu perfil
  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Hugo', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Tu portátil' })).toBeVisible()

  await page.getByRole('button', { name: 'Editar perfil' }).click()
  await page.getByLabel(/Bio/).fill(bio)
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.locator('header').getByText(bio)).toBeVisible()

  await page.getByRole('link', { name: 'La clase', exact: true }).first().click()
  await expect(page.getByRole('heading', { name: 'Alumnos (6)' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Hugo @hugo-dev/ })).toBeVisible()
})

test('skills: la que propone un alumno queda pendiente hasta que la aprueba un profesor', async ({ page }) => {
  const titulo = `Skill E2E ${crypto.randomUUID().slice(0, 6)}`
  await entrar(page, 'marta@dawhub.dev')
  await page.getByRole('link', { name: 'Skills', exact: true }).click()
  await page.getByRole('button', { name: 'Proponer skill' }).click()
  await page.getByLabel('Título').fill(titulo)
  await page.getByLabel('Enlace').fill('https://roadmap.sh/devops')
  await page.getByLabel('Categoría').selectOption('devops')
  await page.getByRole('button', { name: 'Publicar' }).click()
  const fila = page.getByRole('listitem').filter({ hasText: titulo })
  await expect(fila.getByText('Pendiente de aprobar')).toBeVisible()
  await page.getByRole('button', { name: 'Salir', exact: true }).click()
  await expect(page).toHaveURL('/login')

  await entrar(page, 'luis@dawhub.dev')
  await page.goto('/skills')
  const deLuis = page.getByRole('listitem').filter({ hasText: titulo })
  await deLuis.getByRole('button', { name: 'Aprobar' }).click()
  await expect(deLuis.getByText('Pendiente de aprobar')).toHaveCount(0)
  // Limpieza
  await deLuis.getByRole('button', { name: `Borrar ${titulo}` }).click()
  await deLuis.getByRole('button', { name: '¿Borrar?' }).click()
  await expect(page.getByRole('listitem').filter({ hasText: titulo })).toHaveCount(0)
})
