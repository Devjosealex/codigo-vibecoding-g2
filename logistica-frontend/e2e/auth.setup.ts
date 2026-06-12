import { test as setup, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'

const authFile = path.join(__dirname, '../playwright/.auth/user.json')

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:8000'
const USERNAME = process.env.E2E_USERNAME ?? 'testuser'
const PASSWORD = process.env.E2E_PASSWORD ?? 'testpass123'

setup('authenticate via API and seed localStorage', async ({ page, request }) => {
  const res = await request.post(`${API_URL}/api/auth/token/`, {
    data: { username: USERNAME, password: PASSWORD },
  })
  expect(res.ok(), `Login failed — check E2E_USERNAME/E2E_PASSWORD and that backend is running`).toBeTruthy()

  const { access, refresh } = await res.json()

  const rawPayload = Buffer.from(access.split('.')[1], 'base64url').toString('utf-8')
  const payload = JSON.parse(rawPayload)
  const user = {
    id: payload.user_id as number,
    username: USERNAME,
    is_superuser: (payload.is_superuser as boolean) ?? false,
  }

  // Navigate to the frontend origin so we can write to its localStorage
  await page.goto('/')
  await page.evaluate(
    ({ accessToken, refreshToken, userJson }) => {
      localStorage.setItem('access_token', accessToken)
      localStorage.setItem('refresh_token', refreshToken)
      localStorage.setItem('user', userJson)
    },
    { accessToken: access, refreshToken: refresh, userJson: JSON.stringify(user) }
  )

  fs.mkdirSync(path.dirname(authFile), { recursive: true })
  await page.context().storageState({ path: authFile })
})
