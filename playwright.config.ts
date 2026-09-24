import { defineConfig, devices } from '@playwright/test'

/**
 * Test end-to-end contro uno stack Supabase locale (`npx supabase start`)
 * e il dev server Vite (variabili in .env.local).
 */
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173',
    ...devices['iPhone 13'],
    browserName: 'chromium',
    locale: 'it-IT',
    timezoneId: 'Europe/Rome',
    launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH || undefined },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host localhost --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
