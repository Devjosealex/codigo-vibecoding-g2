import { test, expect } from './fixtures'
import type { Page } from '@playwright/test'

const USERNAME = process.env.E2E_USERNAME ?? 'testuser'
const PASSWORD = process.env.E2E_PASSWORD ?? 'testpass123'
const uid = () => Math.random().toString(36).substring(2, 8)

async function loginFresh(page: Page) {
  await page.goto('/login')
  await page.fill('#username', USERNAME)
  await page.fill('#password', PASSWORD)
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/dashboard', { timeout: 10_000 })
}

async function goToDrivers(page: Page) {
  await page.getByRole('link', { name: 'Conductores', exact: true }).click()
  await expect(page).toHaveURL('/drivers', { timeout: 10_000 })
}

async function getDriverId(page: Page, fullName: string): Promise<number> {
  const row = page.locator('table tbody tr').filter({ hasText: fullName })
  const href = await row.locator('a[href^="/drivers/"]').getAttribute('href')
  return Number(href!.split('/').pop())
}

const validDriver = () => ({
  first_name: `E2E-Nombre-${uid()}`,
  last_name: `E2E-Apellido-${uid()}`,
  document_number: `DOC-${uid()}`,
  license_number: `LIC-${uid()}`,
  license_expiry: '2027-06-15',
  phone: '999999999',
  email: `driver-${uid()}@test.com`,
})

test.describe('Drivers CRUD', () => {
  test('list loads and renders table with seeded data', async ({ page, seed, remove }) => {
    const d1 = validDriver()
    const d2 = validDriver()
    const id1 = await seed('drivers', d1)
    const id2 = await seed('drivers', d2)

    try {
      await loginFresh(page)
      await goToDrivers(page)
      await expect(page.getByRole('heading', { name: 'Conductores' })).toBeVisible()
      await expect(page.getByText(`${d1.first_name} ${d1.last_name}`)).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText(`${d2.first_name} ${d2.last_name}`)).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText(/\d+ conductor\(es\)/)).toBeVisible({ timeout: 10_000 })
    } finally {
      await remove('drivers', id1)
      await remove('drivers', id2)
    }
  })

  test('create a new driver', async ({ page, remove }) => {
    const driverName = `E2E-Crear-${uid()}`
    const driverEmail = `driver-${uid()}@test.com`

    await loginFresh(page)
    await goToDrivers(page)

    await page.getByRole('link', { name: /Nuevo conductor/ }).click()
    await expect(page).toHaveURL('/drivers/new', { timeout: 10_000 })
    await expect(page.getByRole('heading', { name: 'Nuevo conductor' })).toBeVisible()

    await page.fill('#first_name', driverName)
    await page.fill('#last_name', `Apellido-${uid()}`)
    await page.fill('#email', driverEmail)
    await page.fill('#phone', '987654321')
    await page.fill('#document_number', `DOC-CREAR-${uid()}`)
    await page.fill('#license_number', `LIC-CREAR-${uid()}`)
    await page.getByText('Seleccionar fecha').click()
    await page.locator('.rdp-day_button').filter({ hasText: /^15$/ }).click()

    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/drivers', { timeout: 10_000 })
    await expect(page.getByText(driverName)).toBeVisible({ timeout: 10_000 })

    const id = await getDriverId(page, driverName)
    await remove('drivers', id)
  })

  test('validation shows errors on empty form', async ({ page }) => {
    await loginFresh(page)
    await goToDrivers(page)

    await page.getByRole('link', { name: /Nuevo conductor/ }).click()
    await expect(page).toHaveURL('/drivers/new', { timeout: 10_000 })
    await expect(page.getByRole('heading', { name: 'Nuevo conductor' })).toBeVisible()

    await page.click('button[type="submit"]')

    await expect(page.getByText('El nombre es requerido')).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText('El apellido es requerido')).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText('El email es requerido')).toBeVisible({ timeout: 5_000 })
    await expect(page).toHaveURL('/drivers/new')
  })

  test('document_number uniqueness shows backend error', async ({ page, seed, remove }) => {
    const duplicateDoc = `DUP-${uid()}`
    const d1 = { ...validDriver(), document_number: duplicateDoc }
    const id = await seed('drivers', d1)

    await loginFresh(page)
    await goToDrivers(page)

    await page.getByRole('link', { name: /Nuevo conductor/ }).click()
    await expect(page).toHaveURL('/drivers/new', { timeout: 10_000 })

    await page.fill('#first_name', `E2E-Dup-${uid()}`)
    await page.fill('#last_name', `Apellido-${uid()}`)
    await page.fill('#email', `dup-${uid()}@test.com`)
    await page.fill('#document_number', duplicateDoc)
    await page.fill('#license_number', `LIC-DUP-${uid()}`)
    await page.getByText('Seleccionar fecha').click()
    await page.locator('.rdp-day_button').filter({ hasText: /^15$/ }).click()
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/drivers/new')
    await expect(page.locator('button[type="submit"]')).toBeVisible()

    await remove('drivers', id)
  })

  test('edit a driver', async ({ page, seed, remove }) => {
    const payload = validDriver()
    const id = await seed('drivers', payload)
    const newFirstName = `${payload.first_name}-editado`

    try {
      await loginFresh(page)
      await goToDrivers(page)
      await expect(page.getByText(payload.first_name)).toBeVisible({ timeout: 10_000 })

      const row = page.locator('table tbody tr').filter({ hasText: payload.first_name })
      await row.locator('a[href^="/drivers/"]').click()
      await expect(page).toHaveURL(/\/drivers\/\d+/, { timeout: 10_000 })
      await expect(page.getByRole('heading', { name: 'Editar conductor' })).toBeVisible()

      await expect(page.locator('#first_name')).toHaveValue(payload.first_name)
      await page.fill('#first_name', newFirstName)
      await page.click('button[type="submit"]')

      await expect(page).toHaveURL('/drivers', { timeout: 10_000 })
      await expect(page.getByText(newFirstName)).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText(payload.first_name, { exact: true })).not.toBeVisible()
    } finally {
      await remove('drivers', id)
    }
  })

  test('delete a driver', async ({ page, seed }) => {
    const payload = validDriver()
    const id = await seed('drivers', payload)

    await loginFresh(page)
    await goToDrivers(page)
    await expect(page.getByText(payload.first_name)).toBeVisible({ timeout: 10_000 })

    const row = page.locator('table tbody tr').filter({ hasText: payload.first_name })
    await row.locator('button').filter({ has: page.locator('.lucide-trash2') }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('Eliminar conductor')
    await expect(dialog).toContainText(`${payload.first_name} ${payload.last_name}`)

    await dialog.getByRole('button', { name: 'Eliminar' }).click()

    await expect(page.getByText(payload.first_name)).not.toBeVisible({ timeout: 10_000 })
  })
})
