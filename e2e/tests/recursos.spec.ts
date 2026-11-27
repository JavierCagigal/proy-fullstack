import { expect, test } from '@playwright/test'
import { entrar } from './helpers'

test('el profesor publica un recurso visible y otro oculto; el alumno solo ve el visible', async ({ page }) => {
  const tema = `E2E ${crypto.randomUUID().slice(0, 8)}`

  await entrar(page, 'ana@dawhub.dev')
  await page.getByRole('link', { name: 'Asignaturas', exact: true }).click()
  await page.getByRole('link', { name: /Desarrollo Web en Entorno Cliente/ }).click()

  await page.getByLabel('Nuevo tema').fill(tema)
  await page.getByRole('button', { name: 'Añadir tema' }).click()
  const seccion = page.getByRole('region', { name: new RegExp(tema) })
  await expect(seccion).toBeVisible()

  // Recurso visible con Markdown
  await seccion.getByRole('button', { name: 'Añadir recurso' }).click()
  await seccion.getByLabel('Título', { exact: true }).fill('Apunte visible')
  await seccion.getByLabel(/Contenido/).fill('## Hola\n\nCon **negrita**.')
  await seccion.getByRole('button', { name: 'Publicar recurso' }).click()
  await expect(seccion.getByText('Apunte visible')).toBeVisible()

  // Recurso oculto
  await seccion.getByRole('button', { name: 'Añadir recurso' }).click()
  await seccion.getByLabel('Título', { exact: true }).fill('Solución oculta')
  await seccion.getByText('Solo yo (oculto)').click()
  await seccion.getByRole('button', { name: 'Publicar recurso' }).click()
  await expect(seccion.getByText('Oculto', { exact: true })).toBeVisible()
  const url = page.url()

  // El alumno ve el tema con el visible (y su Markdown), pero no el oculto
  await page.getByRole('button', { name: 'Salir', exact: true }).click()
  await expect(page).toHaveURL('/login')
  await entrar(page, 'lucia@dawhub.dev')
  await page.goto(url)
  const comoAlumno = page.getByRole('region', { name: new RegExp(tema) })
  await comoAlumno.getByText('Leer apunte').click()
  await expect(comoAlumno.getByRole('heading', { name: 'Hola' })).toBeVisible()
  await expect(comoAlumno.getByText('Solución oculta')).toHaveCount(0)
  await expect(comoAlumno.getByRole('button', { name: 'Añadir recurso' })).toHaveCount(0)

  // Limpieza: el profesor borra el tema (borrado en dos pasos)
  await page.getByRole('button', { name: 'Salir', exact: true }).click()
  await expect(page).toHaveURL('/login')
  await entrar(page, 'ana@dawhub.dev')
  await page.goto(url)
  const borrar = page.getByRole('button', { name: `Borrar el tema ${tema}` })
  await borrar.click()
  await page.getByRole('button', { name: '¿Borrar tema y recursos?' }).click()
  await expect(page.getByRole('region', { name: new RegExp(tema) })).toHaveCount(0)
})
