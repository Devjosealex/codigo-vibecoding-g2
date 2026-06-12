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

async function goToProducts(page: Page) {
  await page.getByRole('link', { name: 'Productos', exact: true }).click()
  await expect(page).toHaveURL('/products', { timeout: 10_000 })
}

async function seedSupplierAndWarehouse(
  seed: (endpoint: string, payload: Record<string, unknown>) => Promise<number>,
): Promise<{ supplierId: number; warehouseId: number }> {
  const tag = uid()
  const supplierId = await seed('suppliers', {
    name: `E2E-Supplier-${tag}`,
    contact_name: 'Test Contact',
    phone: '999999999',
    email: `supplier-${tag}@test.com`,
    address: 'Av. Test 123',
  })
  const warehouseId = await seed('warehouses', {
    name: `E2E-Warehouse-${tag}`,
    address: 'Av. Test 456',
    city: 'Lima',
    country: 'Peru',
    capacity_m3: '5000.00',
  })
  return { supplierId, warehouseId }
}

async function getProductId(page: Page, name: string): Promise<number> {
  const row = page.locator('table tbody tr').filter({ hasText: name })
  const href = await row.locator('a[href^="/products/"]').getAttribute('href')
  return Number(href!.split('/').pop())
}

const validProduct = () => ({
  name: `E2E-Producto-${uid()}`,
  sku: `SKU-${uid()}`,
  unit_price: '99.99',
  stock_quantity: 10,
  weight_kg: '0.000',
})

test.describe('Products CRUD', () => {
  test('list loads and renders table with seeded data', async ({ page, seed, remove }) => {
    const { supplierId, warehouseId } = await seedSupplierAndWarehouse(seed)
    const p1 = { ...validProduct(), supplier: supplierId, warehouse: warehouseId }
    const p2 = { ...validProduct(), supplier: supplierId, warehouse: warehouseId }
    const id1 = await seed('products', p1)
    const id2 = await seed('products', p2)

    try {
      await loginFresh(page)
      await goToProducts(page)
      await expect(page.getByRole('heading', { name: 'Productos' })).toBeVisible()
      await expect(page.getByText(p1.name)).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText(p2.name)).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText(/\d+ producto\(s\)/)).toBeVisible({ timeout: 10_000 })
    } finally {
      await remove('products', id1)
      await remove('products', id2)
      await remove('suppliers', supplierId)
      await remove('warehouses', warehouseId)
    }
  })

  test('create a new product with warehouse and supplier selects', async ({ page, seed, remove }) => {
    const warehouseName = `E2E-Almacén-${uid()}`
    const supplierName = `E2E-Proveedor-${uid()}`
    const wid = await seed('warehouses', {
      name: warehouseName,
      address: 'Av. Test 123',
      city: 'Lima',
      country: 'Peru',
      capacity_m3: '5000.00',
    })
    const sid = await seed('suppliers', {
      name: supplierName,
      contact_person: 'Test Contact',
      phone: '999999999',
      email: `supplier-${uid()}@test.com`,
      address: 'Av. Test 456',
    })

    const productName = `E2E-Crear-${uid()}`
    const sku = `SKU-CREAR-${uid()}`

    await loginFresh(page)
    await goToProducts(page)

    await page.getByRole('link', { name: /Nuevo producto/ }).click()
    await expect(page).toHaveURL('/products/new', { timeout: 10_000 })
    await expect(page.getByRole('heading', { name: 'Nuevo producto' })).toBeVisible()

    await page.fill('#name', productName)
    await page.fill('#sku', sku)
    await page.fill('#unit_price', '150.00')
    await page.fill('#stock_quantity', '25')
    await page.fill('#weight_kg', '1.500')

    await page.getByText('Seleccionar proveedor').click()
    await page.getByRole('option', { name: supplierName }).click()

    await page.getByText('Seleccionar almacén').click()
    await page.getByRole('option', { name: warehouseName }).click()

    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/products', { timeout: 10_000 })
    await expect(page.getByText(productName)).toBeVisible({ timeout: 10_000 })

    const pid = await getProductId(page, productName)
    await remove('products', pid)
    await remove('suppliers', sid)
    await remove('warehouses', wid)
  })

  test('validation shows errors on empty form', async ({ page }) => {
    await loginFresh(page)
    await goToProducts(page)

    await page.getByRole('link', { name: /Nuevo producto/ }).click()
    await expect(page).toHaveURL('/products/new', { timeout: 10_000 })
    await expect(page.getByRole('heading', { name: 'Nuevo producto' })).toBeVisible()

    await page.click('button[type="submit"]')

    await expect(page.getByText('El nombre es requerido')).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText('El SKU es requerido')).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText('El precio es requerido')).toBeVisible({ timeout: 5_000 })
    await expect(page).toHaveURL('/products/new')
  })

  test('SKU uniqueness shows backend error', async ({ page, seed, remove }) => {
    const { supplierId, warehouseId } = await seedSupplierAndWarehouse(seed)
    const duplicateSku = `DUP-${uid()}`
    const p1 = { ...validProduct(), sku: duplicateSku, supplier: supplierId, warehouse: warehouseId }
    const id = await seed('products', p1)

    await loginFresh(page)
    await goToProducts(page)

    await page.getByRole('link', { name: /Nuevo producto/ }).click()
    await expect(page).toHaveURL('/products/new', { timeout: 10_000 })

    await page.fill('#name', `E2E-Dup-${uid()}`)
    await page.fill('#sku', duplicateSku)
    await page.fill('#unit_price', '50.00')
    await page.fill('#stock_quantity', '5')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/products/new')
    await expect(page.locator('button[type="submit"]')).toBeVisible()

    await remove('products', id)
    await remove('suppliers', supplierId)
    await remove('warehouses', warehouseId)
  })

  test('edit a product', async ({ page, seed, remove }) => {
    const warehouseName = `E2E-Almacén-${uid()}`
    const supplierName = `E2E-Proveedor-${uid()}`
    const wid = await seed('warehouses', {
      name: warehouseName,
      address: 'Av. Test 456',
      city: 'Lima',
      country: 'Peru',
      capacity_m3: '5000.00',
    })
    const sid = await seed('suppliers', {
      name: supplierName,
      contact_name: 'Test Contact',
      phone: '999999999',
      email: `supplier-${uid()}@test.com`,
      address: 'Av. Test 789',
    })

    const payload = { ...validProduct(), supplier: sid, warehouse: wid }
    const pid = await seed('products', payload)
    const newName = `${payload.name}-editado`

    try {
      await loginFresh(page)
      await goToProducts(page)
      await expect(page.getByText(payload.name)).toBeVisible({ timeout: 10_000 })

      const row = page.locator('table tbody tr').filter({ hasText: payload.name })
      await row.locator('a[href^="/products/"]').click()
      await expect(page).toHaveURL(/\/products\/\d+/, { timeout: 10_000 })
      await expect(page.getByRole('heading', { name: 'Editar producto' })).toBeVisible()

      await expect(page.locator('#name')).toHaveValue(payload.name)
      await page.fill('#name', newName)
      await page.click('button[type="submit"]')

      await expect(page).toHaveURL('/products', { timeout: 10_000 })
      await expect(page.getByText(newName)).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText(payload.name, { exact: true })).not.toBeVisible()
    } finally {
      await remove('products', pid)
      await remove('suppliers', sid)
      await remove('warehouses', wid)
    }
  })

  test('delete a product', async ({ page, seed, remove }) => {
    const { supplierId, warehouseId } = await seedSupplierAndWarehouse(seed)
    const payload = { ...validProduct(), supplier: supplierId, warehouse: warehouseId }
    const id = await seed('products', payload)

    await loginFresh(page)
    await goToProducts(page)
    await expect(page.getByText(payload.name)).toBeVisible({ timeout: 10_000 })

    const row = page.locator('table tbody tr').filter({ hasText: payload.name })
    await row.locator('button').filter({ has: page.locator('.lucide-trash2') }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('Eliminar producto')
    await expect(dialog).toContainText(payload.name)

    await dialog.getByRole('button', { name: 'Eliminar' }).click()

    await expect(page.getByText(payload.name)).not.toBeVisible({ timeout: 10_000 })

    await remove('suppliers', supplierId)
    await remove('warehouses', warehouseId)
  })
})
