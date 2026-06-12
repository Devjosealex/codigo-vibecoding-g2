import { test, expect } from '@playwright/test'

const USERNAME = process.env.E2E_USERNAME ?? 'testuser'
const PASSWORD = process.env.E2E_PASSWORD ?? 'testpass123'

test.describe('Authentication - clean state', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('valid credentials redirect to /dashboard and show protected layout', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#username', USERNAME)
    await page.fill('#password', PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard', { timeout: 10_000 })
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByTitle('Cerrar sesión')).toBeVisible()
  })

  test('invalid credentials show error and remain on /login', async ({ page }) => {
    await page.route('**/api/auth/token/', async (route, request) => {
      if (request.method() === 'POST') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Usuario o contraseña incorrectos.' }),
        })
      } else {
        await route.continue()
      }
    })
    await page.goto('/login')
    await page.fill('#username', USERNAME)
    await page.fill('#password', 'wrong-password-xyz!')
    await page.click('button[type="submit"]')
    const errorBox = page.locator('[class*="bg-destructive"]')
    await expect(errorBox).toBeVisible({ timeout: 10_000 })
    await expect(errorBox).toContainText('Usuario o contraseña incorrectos.')
    await expect(page).toHaveURL('/login')
  })

  test('no token redirects protected route to /login', async ({ page }) => {
    await page.goto('/warehouses')
    await expect(page).toHaveURL('/login', { timeout: 10_000 })
  })
})

test.describe('Authentication - authenticated session', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('logout clears tokens and redirects to /login; re-access redirects again', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#username', USERNAME)
    await page.fill('#password', PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard', { timeout: 10_000 })
    await expect(page.getByTitle('Cerrar sesión')).toBeVisible({ timeout: 10_000 })

    const hasTokens = await page.evaluate(() => {
      return !!(localStorage.getItem('access_token') && localStorage.getItem('refresh_token'))
    })
    expect(hasTokens).toBe(true)

    await page.getByTitle('Cerrar sesión').click()
    await expect(page).toHaveURL('/login', { timeout: 15_000 })

    const tokensCleared = await page.evaluate(() => {
      return !localStorage.getItem('access_token') && !localStorage.getItem('refresh_token') && !localStorage.getItem('user')
    })
    expect(tokensCleared).toBe(true)

    await page.goto('/warehouses')
    await expect(page).toHaveURL('/login', { timeout: 10_000 })
  })

  test('expired access token triggers refresh and retries without redirecting to login', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#username', USERNAME)
    await page.fill('#password', PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard', { timeout: 10_000 })
    await expect(page.getByRole('link', { name: 'Almacenes' })).toBeVisible()

    await page.evaluate(() => {
      localStorage.setItem('access_token', 'INVALID-EXPIRED-TOKEN')
    })

    let apiCallCount = 0
    await page.route('**/api/v1/**', async (route) => {
      apiCallCount++
      if (apiCallCount === 1) {
        await route.fulfill({ status: 401 })
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
      }
    })
    await page.route('**/api/auth/token/refresh/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ access: 'refreshed-fake-access-token' }),
      })
    })

    await page.getByRole('link', { name: 'Almacenes' }).click()
    await page.waitForURL('/warehouses', { timeout: 15_000 })
    await page.waitForLoadState('networkidle')

    expect(apiCallCount).toBeGreaterThanOrEqual(2)
    const savedToken = await page.evaluate(() => localStorage.getItem('access_token'))
    expect(savedToken).toBe('refreshed-fake-access-token')
  })
})
