import { expect, test } from '@playwright/test'
import { entrar } from './helpers'

test('sin sesión, cualquier ruta lleva al login', async ({ page }) => {
  await page.goto('/retos')
  await expect(page).toHaveURL('/login')
  await expect(page.getByRole('heading', { name: 'Hola de nuevo' })).toBeVisible()
})

test('registro → entra como alumno, la sesión sobrevive a recargar y "Salir" la cierra', async ({ page }) => {
  await page.goto('/registro')
  await page.getByLabel('Nombre').fill('Alumna E2E')
  await page.getByLabel('Email').fill(`e2e-${crypto.randomUUID()}@dawhub.dev`)
  await page.getByLabel('Contraseña').fill('contraseña-e2e')
  await page.getByRole('button', { name: 'Crear cuenta' }).click()

  await expect(page).toHaveURL('/')
  const rail = page.getByRole('navigation', { name: 'Principal' })
  await expect(rail.getByText('Alumna E2E')).toBeVisible()
  await expect(rail.getByText('alumno', { exact: true })).toBeVisible()

  await page.reload()
  await expect(rail.getByText('Alumna E2E')).toBeVisible()

  await page.getByRole('button', { name: 'Salir' }).click()
  await expect(page).toHaveURL('/login')
  await page.goto('/')
  await expect(page).toHaveURL('/login')
})

test('login con contraseña incorrecta muestra el error', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill('lucia@dawhub.dev')
  await page.getByLabel('Contraseña').fill('no-es-esta')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('alert')).toHaveText('Email o contraseña incorrectos')
  await expect(page).toHaveURL('/login')
})

test('solo el admin ve y usa la gestión de usuarios', async ({ page }) => {
  await entrar(page, 'lucia@dawhub.dev')
  await expect(page.getByRole('link', { name: 'Usuarios' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Salir' }).click()
  await expect(page).toHaveURL('/login')

  await entrar(page, 'admin@dawhub.dev')
  await page.getByRole('link', { name: 'Usuarios' }).click()
  await expect(page).toHaveURL('/admin/usuarios')

  const rolDePablo = page.getByLabel('Rol de Pablo')
  await rolDePablo.selectOption('profesor')
  await expect(page.getByRole('status')).toHaveText('Pablo ahora es profesor.')
  await rolDePablo.selectOption('alumno') // lo dejamos como estaba
  await expect(page.getByRole('status')).toHaveText('Pablo ahora es alumno.')
})
