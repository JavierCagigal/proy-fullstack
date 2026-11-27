import { expect, test } from '@playwright/test'

test('la home conecta con la API y la BD', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('API ✅ · BD ✅')).toBeVisible()
})

test('navegar es SPA: cambia la URL sin recargar la página', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => ((window as any).sinRecarga = true))

  await page.getByRole('link', { name: 'Retos' }).click()
  await expect(page).toHaveURL('/retos')
  expect(await page.evaluate(() => (window as any).sinRecarga)).toBe(true)

  await page.goBack()
  await expect(page).toHaveURL('/')
})
