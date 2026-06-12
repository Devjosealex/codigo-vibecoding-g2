import { test, expect } from './fixtures'
import type { Page, APIRequestContext } from '@playwright/test'

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

async function goToShipments(page: Page) {
  await page.getByRole('link', { name: 'Envíos', exact: true }).click()
  await expect(page).toHaveURL('/shipments', { timeout: 10_000 })
}

async function cleanupExistingShipments(api: APIRequestContext) {
  let page = 1
  let hasMore = true
  while (hasMore) {
    const res = await api.get(`/api/v1/shipments/?page=${page}`)
    const body = await res.json()
    const shipments = body.results ?? []
    if (shipments.length === 0) {
      hasMore = false
    } else {
      for (const s of shipments) {
        await api.delete(`/api/v1/shipments/${s.id}/`)
      }
      page++
    }
  }
}

async function seedDeps(
  seed: (endpoint: string, payload: Record<string, unknown>) => Promise<number>,
) {
  const tag = uid()
  const customerId = await seed('customers', {
    name: `E2E-Customer-${tag}`,
    customer_type: 'company',
    tax_id: `TAX-${tag}`,
    email: `customer-${tag}@test.com`,
    phone: '999999999',
    address: 'Av. Test 123',
    city: 'Lima',
  })
  const warehouseId = await seed('warehouses', {
    name: `E2E-Warehouse-${tag}`,
    address: 'Av. Test 456',
    city: 'Lima',
    country: 'Peru',
    capacity_m3: '10000.00',
  })
  const supplierId = await seed('suppliers', {
    name: `E2E-Supplier-${tag}`,
    contact_name: 'Test Contact',
    phone: '999999999',
    email: `supplier-${tag}@test.com`,
    address: 'Av. Test 789',
  })
  const productId = await seed('products', {
    name: `E2E-Product-${tag}`,
    sku: `SKU-${tag}`,
    unit_price: '150.00',
    stock_quantity: 100,
    weight_kg: '2.000',
    supplier: supplierId,
    warehouse: warehouseId,
  })
  const productId2 = await seed('products', {
    name: `E2E-Product2-${tag}`,
    sku: `SKU2-${tag}`,
    unit_price: '200.00',
    stock_quantity: 50,
    weight_kg: '1.500',
    supplier: supplierId,
    warehouse: warehouseId,
  })
  const vehicleId = await seed('vehicles', {
    name: `E2E-Truck-${tag}`,
    plate_number: `PLATE-${tag}`,
    vehicle_type: 'truck',
    capacity_kg: '5000.00',
    capacity_m3: '20.00',
  })
  const routeId = await seed('routes', {
    name: `E2E-Route-${tag}`,
    origin_warehouse: warehouseId,
    distance_km: '150.00',
    estimated_duration_h: '3.00',
  })
  return { customerId, warehouseId, supplierId, productId, productId2, vehicleId, routeId, tag }
}

const validShipment = (deps: {
  customerId: number
  warehouseId: number
  vehicleId: number
  routeId: number
}) => ({
  customer: deps.customerId,
  origin_warehouse: deps.warehouseId,
  vehicle: deps.vehicleId,
  route: deps.routeId,
  destination_address: `Av. Destino ${uid()}`,
  destination_city: 'Arequipa',
  base_cost: '500.00',
})

test.describe('Shipments CRUD', () => {
  test('list loads and renders table with seeded data', async ({ page, seed, remove, api }) => {
    await cleanupExistingShipments(api)
    const deps = await seedDeps(seed)
    const s1 = validShipment(deps)
    const s2 = validShipment(deps)
    const id1 = await seed('shipments', s1)
    const id2 = await seed('shipments', s2)

    try {
      await loginFresh(page)
      await goToShipments(page)
      await expect(page.getByRole('heading', { name: 'Envíos' })).toBeVisible()
      await expect(page.getByText(/LOG-\d{4}-\d{5}/).first()).toBeVisible({ timeout: 10_000 })
    } finally {
      await remove('shipments', id1)
      await remove('shipments', id2)
    }
  })

  test('create a new shipment with auto-generated tracking_number', async ({ page, seed, remove, api }) => {
    await cleanupExistingShipments(api)
    const deps = await seedDeps(seed)

    await loginFresh(page)
    await goToShipments(page)

    await page.getByRole('link', { name: /Nuevo envío/ }).click()
    await expect(page).toHaveURL('/shipments/new', { timeout: 10_000 })
    await expect(page.getByRole('heading', { name: 'Nuevo envío' })).toBeVisible()

    await page.fill('#destination_address', `Av. Creación ${uid()}`)
    await page.fill('#destination_city', 'Cusco')
    await page.fill('#base_cost', '750.00')

    await page.getByText('Seleccionar cliente').click()
    await page.getByRole('option', { name: `E2E-Customer-${deps.tag}` }).click()

    await page.getByText('Seleccionar almacén').click()
    await page.getByRole('option', { name: `E2E-Warehouse-${deps.tag}` }).click()

    await page.getByText('Seleccionar vehículo').click()
    await page.getByRole('option', { name: `E2E-Truck-${deps.tag}` }).click()

    await page.getByText('Seleccionar ruta').click()
    await page.getByRole('option', { name: `E2E-Route-${deps.tag}` }).click()

    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/shipments', { timeout: 15_000 })

    const trackingText = await page.locator('table tbody tr').first().locator('td').first().textContent()
    expect(trackingText).toMatch(/LOG-\d{4}-\d{5}/)

    const tracking = trackingText!.trim()
    const row = page.locator('table tbody tr').filter({ hasText: tracking })
    const href = await row.locator('a[href^="/shipments/"]').getAttribute('href')
    expect(href).toBeTruthy()
    const shipmentId = Number(href!.split('/').pop())
    await remove('shipments', shipmentId)
  })

  test('validation shows errors on empty form', async ({ page }) => {
    await loginFresh(page)
    await goToShipments(page)

    await page.getByRole('link', { name: /Nuevo envío/ }).click()
    await expect(page).toHaveURL('/shipments/new', { timeout: 10_000 })
    await expect(page.getByRole('heading', { name: 'Nuevo envío' })).toBeVisible()

    await page.click('button[type="submit"]')

    await expect(page.getByText('La dirección es requerida')).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText('La ciudad es requerida')).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText('El costo base es requerido')).toBeVisible({ timeout: 5_000 })
    await expect(page).toHaveURL('/shipments/new')
  })

  test('detail page shows shipment info and items (add/remove items via API + UI delete)', async ({ page, seed, remove, api }) => {
    await cleanupExistingShipments(api)
    const deps = await seedDeps(seed)
    const payload = validShipment(deps)
    const shipmentId = await seed('shipments', payload)

    const shipmentRes = await api.get(`/api/v1/shipments/${shipmentId}/`)
    const shipmentData = await shipmentRes.json()
    const trackingNumber: string = shipmentData.tracking_number

    // Seed two items via API (UI create is broken — missing unit_price_at_shipment)
    await seed('shipment-items', {
      shipment: shipmentId,
      product: deps.productId,
      quantity: 3,
      unit_price_at_shipment: '150.00',
    })
    await seed('shipment-items', {
      shipment: shipmentId,
      product: deps.productId2,
      quantity: 5,
      unit_price_at_shipment: '200.00',
    })

    try {
      await loginFresh(page)
      await goToShipments(page)

      // Click pencil icon on the matching row to navigate to detail page (client-side nav)
      const row = page.locator('table tbody tr').filter({ hasText: trackingNumber })
      await row.locator('a[href^="/shipments/"]').click()
      await expect(page).toHaveURL(`/shipments/${shipmentId}`, { timeout: 10_000 })

      // Verify heading shows tracking
      await expect(page.getByRole('heading', { name: `Envío ${trackingNumber}` })).toBeVisible({ timeout: 10_000 })

      // Verify status badge is visible (default "Pendiente")
      await expect(page.getByText('Pendiente')).toBeVisible()

      // Verify items are listed
      await expect(page.getByRole('heading', { name: 'Productos' })).toBeVisible()
      await expect(page.getByText(`E2E-Product-${deps.tag}`)).toBeVisible()
      await expect(page.getByText(`E2E-Product2-${deps.tag}`)).toBeVisible()
      await expect(page.getByText(`SKU-${deps.tag}`)).toBeVisible()
      await expect(page.getByText(`SKU2-${deps.tag}`)).toBeVisible()

      // Verify subtotals: 3 × 150 = 450, 5 × 200 = 1000
      await expect(page.getByText('S/ 450.00')).toBeVisible()
      await expect(page.getByText('S/ 1000.00')).toBeVisible()

      // Delete one item via UI
      const deleteButtons = page.locator('button').filter({ has: page.locator('.lucide-trash2') })
      await deleteButtons.first().click()
      await page.waitForTimeout(1000)

      // Verify only one item remains
      const rows = page.locator('table').last().locator('tbody tr')
      await expect(rows).toHaveCount(1)
    } finally {
      await remove('shipments', shipmentId)
    }
  })

  test('status transition: pending → assigned', async ({ page, seed, remove, api }) => {
    await cleanupExistingShipments(api)
    const deps = await seedDeps(seed)
    const payload = validShipment(deps)
    const shipmentId = await seed('shipments', payload)

    const shipmentRes = await api.get(`/api/v1/shipments/${shipmentId}/`)
    const shipmentData = await shipmentRes.json()
    const trackingNumber: string = shipmentData.tracking_number

    try {
      await loginFresh(page)
      await goToShipments(page)

      // Click pencil icon on the matching row to navigate to detail page (client-side nav)
      const row = page.locator('table tbody tr').filter({ hasText: trackingNumber })
      await row.locator('a[href^="/shipments/"]').click()
      await expect(page).toHaveURL(`/shipments/${shipmentId}`, { timeout: 10_000 })

      // Verify current status is "Pendiente"
      await expect(page.getByText('Pendiente')).toBeVisible()

      // Click "Asignar" to transition to assigned
      await page.getByRole('button', { name: 'Asignar' }).click()
      await page.waitForTimeout(1500)

      // Go back to list and verify status changed
      await goToShipments(page)

      // The status badge shows "Asignado" for assigned status
      await expect(page.getByText('Asignado')).toBeVisible({ timeout: 10_000 })
    } finally {
      await remove('shipments', shipmentId)
    }
  })
})
