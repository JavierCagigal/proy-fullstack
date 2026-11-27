import { expect, test } from '@playwright/test'
import { entrar } from './helpers'

test.beforeEach(({ page }) => entrar(page, 'lucia@dawhub.dev'))

test('la home conecta con la API y la BD', async ({ page }) => {
  await expect(page.getByText('API y BD conectadas')).toBeVisible()
})

test('navegar es SPA: cambia la URL sin recargar la página', async ({ page }) => {
  await page.evaluate(() => ((window as any).sinRecarga = true))

  await page.getByRole('link', { name: 'Asignaturas', exact: true }).click()
  await expect(page).toHaveURL('/asignaturas')
  expect(await page.evaluate(() => (window as any).sinRecarga)).toBe(true)

  await page.goBack()
  await expect(page).toHaveURL('/')
})
