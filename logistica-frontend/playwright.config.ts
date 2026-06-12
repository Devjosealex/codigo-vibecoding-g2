/**
 * Prerequisites to run E2E tests:
 *
 * 1. Backend (Django DRF) running at http://localhost:8000
 *    cd logistica-api && python manage.py runserver
 *
 * 2. Frontend (Next.js) running at http://localhost:3000
 *    cd logistica-frontend && npm run dev
 *
 * 3. A test user must exist in the Django database:
 *    python manage.py shell -c "
 *      from django.contrib.auth.models import User
 *      User.objects.create_superuser('testuser', 'test@test.com', 'testpass123')
 *    "
 *    Or set E2E_USERNAME and E2E_PASSWORD env vars pointing to an existing user.
 *
 * NOTE: webServer is intentionally NOT configured — servers are started manually
 * per project convention. Start both servers before running tests.
 */

import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  workers: process.env.CI ? 1 : 1,
  reporter: [['html'], ['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
})
