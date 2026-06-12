import { test as base, expect } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:8000'
const USERNAME = process.env.E2E_USERNAME ?? 'testuser'
const PASSWORD = process.env.E2E_PASSWORD ?? 'testpass123'

interface ApiFixtures {
  api: APIRequestContext
  seed: (endpoint: string, payload: Record<string, unknown>) => Promise<number>
  remove: (endpoint: string, id: number) => Promise<void>
}

export const test = base.extend<ApiFixtures>({
  api: async ({ playwright }, use) => {
    const bootstrap = await playwright.request.newContext()
    const tokenRes = await bootstrap.post(`${API_URL}/api/auth/token/`, {
      data: { username: USERNAME, password: PASSWORD },
    })
    expect(tokenRes.ok()).toBeTruthy()
    const { access } = await tokenRes.json()
    await bootstrap.dispose()

    const ctx = await playwright.request.newContext({
      baseURL: API_URL,
      extraHTTPHeaders: {
        Authorization: `Bearer ${access}`,
        'Content-Type': 'application/json',
      },
    })
    await use(ctx)
    await ctx.dispose()
  },

  seed: async ({ api }, use) => {
    await use(async (endpoint: string, payload: Record<string, unknown>) => {
      const res = await api.post(`/api/v1/${endpoint}/`, { data: payload })
      const body = await res.json()
      if (!res.ok()) {
        throw new Error(
          `seed ${endpoint} failed: ${res.status()} — ${JSON.stringify(body)}`,
        )
      }
      return body.id as number
    })
  },

  remove: async ({ api }, use) => {
    await use(async (endpoint: string, id: number) => {
      await api.delete(`/api/v1/${endpoint}/${id}/`)
    })
  },
})

export { expect }
