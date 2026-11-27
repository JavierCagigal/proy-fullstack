import { expect, type Page } from '@playwright/test'

// Usuarios del seed (backend/prisma/seed.ts). En local la contraseña es dawhub123.
export async function entrar(page: Page, email: string, password = 'dawhub123') {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL('/')
}
