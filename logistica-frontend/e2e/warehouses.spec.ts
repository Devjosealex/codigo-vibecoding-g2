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

async function goToWarehouses(page: Page) {
  await page.getByRole('link', { name: 'Almacenes' }).click()
  await expect(page).toHaveURL('/warehouses', { timeout: 10_000 })
}

async function getWarehouseId(page: Page, name: string): Promise<number> {
  const row = page.locator('table tbody tr').filter({ hasText: name })
  const href = await row.locator('a[href^="/warehouses/"]').getAttribute('href')
  return Number(href!.split('/').pop())
}

const validPayload = () => ({
  name: `E2E-Almacén-${uid()}`,
  address: 'Av. Prueba 123',
  city: 'Lima',
  country: 'Peru',
  capacity_m3: '1000.00',
})

test.describe('Warehouses CRUD', () => {
  test('list loads and renders table with seeded data', async ({ page, seed, remove }) => {
    const w1 = validPayload()
    const w2 = validPayload()
    const id1 = await seed('warehouses', w1)
    const id2 = await seed('warehouses', w2)

    try {
      await loginFresh(page)
      await goToWarehouses(page)
      await expect(page.getByRole('heading', { name: 'Almacenes' })).toBeVisible()
      await expect(page.getByText(w1.name)).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText(w2.name)).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText(/\d+ almacén\(es\)/)).toBeVisible({ timeout: 10_000 })
    } finally {
      await remove('warehouses', id1)
      await remove('warehouses', id2)
    }
  })

  test('create a new warehouse', async ({ page, remove }) => {
    const warehouseName = `E2E-Crear-${uid()}`

    await loginFresh(page)
    await goToWarehouses(page)

    await page.getByRole('link', { name: /Nuevo almacén/ }).click()
    await expect(page).toHaveURL('/warehouses/new', { timeout: 10_000 })
    await expect(page.getByRole('heading', { name: 'Nuevo almacén' })).toBeVisible()

    await page.fill('#name', warehouseName)
    await page.fill('#address', 'Av. Nueva 456')
    await page.fill('#city', 'Arequipa')
    await page.fill('#country', 'Peru')
    await page.fill('#capacity_m3', '2500.50')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/warehouses', { timeout: 10_000 })
    await expect(page.getByText(warehouseName)).toBeVisible({ timeout: 10_000 })

    const id = await getWarehouseId(page, warehouseName)
    await remove('warehouses', id)
  })

  test('validation shows errors on empty form', async ({ page }) => {
    await loginFresh(page)
    await goToWarehouses(page)

    await page.getByRole('link', { name: /Nuevo almacén/ }).click()
    await expect(page).toHaveURL('/warehouses/new', { timeout: 10_000 })
    await expect(page.getByRole('heading', { name: 'Nuevo almacén' })).toBeVisible()

    await page.click('button[type="submit"]')

    await expect(page.getByText('El nombre es requerido')).toBeVisible({ timeout: 5_000 })
    await expect(page).toHaveURL('/warehouses/new')
  })

  test('edit a warehouse', async ({ page, seed, remove }) => {
    const payload = validPayload()
    const id = await seed('warehouses', payload)
    const newName = `${payload.name}-editado`

    try {
      await loginFresh(page)
      await goToWarehouses(page)
      await expect(page.getByText(payload.name)).toBeVisible({ timeout: 10_000 })

      const row = page.locator('table tbody tr').filter({ hasText: payload.name })
      await row.locator('a[href^="/warehouses/"]').click()
      await expect(page).toHaveURL(/\/warehouses\/\d+/, { timeout: 10_000 })
      await expect(page.getByRole('heading', { name: 'Editar almacén' })).toBeVisible()

      await expect(page.locator('#name')).toHaveValue(payload.name)
      await page.fill('#name', newName)
      await page.click('button[type="submit"]')

      await expect(page).toHaveURL('/warehouses', { timeout: 10_000 })
      await expect(page.getByText(newName)).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText(payload.name, { exact: true })).not.toBeVisible()
    } finally {
      await remove('warehouses', id)
    }
  })

  test('delete a warehouse', async ({ page, seed }) => {
    const payload = validPayload()
    const id = await seed('warehouses', payload)

    await loginFresh(page)
    await goToWarehouses(page)
    await expect(page.getByText(payload.name)).toBeVisible({ timeout: 10_000 })

    const row = page.locator('table tbody tr').filter({ hasText: payload.name })
    await row.locator('button').filter({ has: page.locator('.lucide-trash2') }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('Eliminar almacén')
    await expect(dialog).toContainText(payload.name)

    await dialog.getByRole('button', { name: 'Eliminar' }).click()

    await expect(page.getByText(payload.name)).not.toBeVisible({ timeout: 10_000 })
  })

  test('search filters warehouses', async ({ page, seed, remove }) => {
    const group = uid()
    const w1 = { ...validPayload(), name: `E2E-Búsqueda-A-${group}` }
    const w2 = { ...validPayload(), name: `E2E-Búsqueda-B-${group}`, city: 'Arequipa' }
    const w3 = { ...validPayload(), name: `E2E-Búsqueda-C-${group}`, city: 'Cusco' }
    const id1 = await seed('warehouses', w1)
    const id2 = await seed('warehouses', w2)
    const id3 = await seed('warehouses', w3)

    try {
      await loginFresh(page)
      await goToWarehouses(page)
      await expect(page.getByText(w1.name)).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText(w2.name)).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText(w3.name)).toBeVisible({ timeout: 10_000 })

      await page.getByPlaceholder('Buscar por nombre, dirección o ciudad...').fill(w1.name)

      await expect(page.getByText(w1.name)).toBeVisible({ timeout: 10_000 })
      await page.waitForTimeout(500)
      await expect(page.getByText(w2.name)).not.toBeVisible()
      await expect(page.getByText(w3.name)).not.toBeVisible()

      await page.getByPlaceholder('Buscar por nombre, dirección o ciudad...').fill('')

      await expect(page.getByText(w1.name)).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText(w2.name)).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText(w3.name)).toBeVisible({ timeout: 10_000 })
    } finally {
      await remove('warehouses', id1)
      await remove('warehouses', id2)
      await remove('warehouses', id3)
    }
  })
})
