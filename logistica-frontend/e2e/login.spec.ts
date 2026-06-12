import { test, expect } from '@playwright/test'

const USERNAME = process.env.E2E_USERNAME ?? 'testuser'
const PASSWORD = process.env.E2E_PASSWORD ?? 'testpass123'

// These tests need a clean (unauthenticated) browser state
test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Login page', () => {
  test('valid credentials redirect to /dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#username', USERNAME)
    await page.fill('#password', PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard', { timeout: 10_000 })
  })

  test('invalid credentials show error message', async ({ page }) => {
    // The axios interceptor in api-client.ts redirects to /login on any 401 response
    // (even from the login endpoint itself), which prevents login-form.tsx from showing
    // the error state. We return 400 instead so the error flows through to the form.
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

    // Error container rendered by login-form.tsx when login throws
    const errorBox = page.locator('[class*="bg-destructive"]')
    await expect(errorBox).toBeVisible({ timeout: 10_000 })
    await expect(errorBox).toContainText('Usuario o contraseña incorrectos.')
    await expect(page).toHaveURL('/login')
  })
})
