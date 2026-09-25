import { expect, type Browser, type Page } from '@playwright/test'

export function uniqueEmail(prefix: string) {
  return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 7)}@example.test`
}

export async function newParent(browser: Browser) {
  const context = await browser.newContext({
    ...(await import('@playwright/test')).devices['iPhone 13'],
    locale: 'it-IT',
    timezoneId: 'Europe/Rome',
  })
  const page = await context.newPage()
  return { context, page }
}

export async function signUp(page: Page, name: string, email: string, path = '/') {
  await page.goto(path)
  await page.getByRole('link', { name: 'Registrati' }).click()
  await page.getByLabel('Il tuo nome').fill(name)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('password-sicura-123')
  await page.getByRole('button', { name: 'Registrati' }).click()
}

export async function createBaby(page: Page, name: string) {
  await expect(page.getByRole('heading', { name: 'Iniziamo' })).toBeVisible()
  await page.getByRole('button', { name: 'Aggiungi bambino' }).click()
  await page.getByLabel('Nome').fill(name)
  const d = new Date(Date.now() - 60 * 86_400_000)
  await page.getByLabel('Data di nascita').fill(d.toISOString().slice(0, 10))
  await page.getByRole('radio', { name: 'Femmina' }).click()
  await page.getByRole('button', { name: 'Salva' }).click()
  await expect(page.getByRole('heading', { name: 'Aggiungi' })).toBeVisible()
}
