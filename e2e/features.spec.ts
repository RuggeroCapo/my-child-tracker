import { expect, test, type Page } from '@playwright/test'
import { createBaby, signUp, uniqueEmail } from './helpers'

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `test-results/screens/${name}.png`, fullPage: true })
}

test('tutte le funzionalità MVP', async ({ page }) => {
  await page.goto('/login')
  await shot(page, 'login')
  await signUp(page, 'Giulia', uniqueEmail('features'))
  await createBaby(page, 'Sofia')

  // Pannolino sporco con dettagli facoltativi
  await page.getByRole('button', { name: 'Pannolino' }).first().click()
  await page.getByRole('button', { name: 'Sporco', exact: true }).click()
  await page.getByRole('radio', { name: 'Medio' }).click()
  await page.getByRole('radio', { name: 'Giallo' }).click()
  await shot(page, 'diaper-details')
  await page.getByRole('button', { name: 'Fatto' }).click()
  await expect(page.getByRole('button', { name: /Pannolino\s*Sporco · medio · giallo/ })).toBeVisible()

  // Biberon rapido
  await page.getByRole('button', { name: 'Biberon' }).first().click()
  await page.getByRole('button', { name: '120 ml', exact: true }).click()
  await page.getByRole('button', { name: 'Latte artificiale' }).click()
  await page.getByRole('button', { name: 'Salva' }).click()
  await expect(page.getByRole('button', { name: /Biberon\s*120 ml · latte artificiale/ })).toBeVisible()

  // Allattamento manuale
  await page.goto('/breastfeeding')
  await page.getByRole('button', { name: 'Inserisci manualmente' }).click()
  await page.getByRole('radio', { name: 'Destro' }).click()
  await page.getByRole('button', { name: 'Salva' }).click()
  await expect(page.getByRole('button', { name: /Allattamento\s*Destro · 15 min/ })).toBeVisible()
  await shot(page, 'breastfeeding')

  // Allattamento in corso → pagina di dettaglio: cambio lato e orario di inizio
  await page.getByRole('button', { name: 'Seno sinistro' }).click()
  await expect(page.getByText('Allattamento in corso')).toBeVisible()
  await page.getByRole('link', { name: 'Dettagli allattamento' }).click()
  await expect(page).toHaveURL(/\/breastfeeding\/[0-9a-f-]+$/)
  await page.getByRole('radio', { name: 'Destro' }).click()
  await page.getByRole('button', { name: '30 minuti fa' }).first().click()
  await page.getByRole('button', { name: 'Salva' }).click()
  await expect(page.getByText(/^Destro · \d\d:\d\d → \d\d:\d\d$/)).toBeVisible()
  await expect(page.getByRole('timer')).toHaveText(/(29|30):\d\d$/)
  await shot(page, 'breastfeeding-detail')
  await page.getByRole('button', { name: 'Termina' }).click()
  await expect(page.getByLabel('Fine')).toBeVisible()

  // Dal diario, un allattamento apre la stessa pagina
  await page.goto('/diary')
  await page.getByRole('button', { name: /Allattamento\s*Destro · (29|30|31) min/ }).click()
  await expect(page).toHaveURL(/\/breastfeeding\/[0-9a-f-]+$/)
  await expect(page.getByLabel('Inizio')).toBeVisible()

  // Tiralatte con timer + quantità
  await page.goto('/pumping')
  await page.getByRole('radio', { name: 'Entrambi' }).click()
  await page.getByRole('button', { name: 'Avvia timer' }).click()
  await expect(page.getByText('Tiralatte in corso')).toBeVisible()
  await page.getByRole('button', { name: 'Termina' }).click()
  await page.getByLabel(/Quantità estratta/).fill('60')
  await page.getByRole('button', { name: 'Termina e salva' }).click()
  await expect(page.getByRole('button', { name: /Tiralatte\s*Entrambi · .* · 60 ml/ })).toBeVisible()
  await shot(page, 'pumping')

  // Registro medicine + somministrazione
  await page.goto('/medications')
  await page.getByRole('button', { name: 'Aggiungi', exact: true }).click()
  await page.getByLabel('Nome').fill('Vitamina D')
  await page.getByLabel(/Dose abituale/).fill('4')
  await page.getByLabel('Unità').selectOption('gocce')
  await page.getByRole('button', { name: 'Salva' }).click()
  await expect(page.getByText('4 gocce')).toBeVisible()
  await page.getByRole('button', { name: 'Registra somministrazione' }).first().click()
  await page.getByRole('dialog').getByRole('button', { name: 'Vitamina D', exact: true }).click()
  await expect(page.getByLabel('Dose')).toHaveValue('4')
  await page.getByRole('button', { name: 'Salva' }).click()
  await expect(page.getByRole('button', { name: /Vitamina D\s*4 gocce/ })).toBeVisible()
  await shot(page, 'medications')

  // Vaccinazione
  await page.goto('/vaccinations')
  await page.getByRole('button', { name: 'Registra vaccinazione' }).click()
  await page.getByLabel('Nome vaccino').fill('Esavalente')
  await page.getByLabel('Dose').selectOption('1')
  await page.getByRole('button', { name: 'Salva' }).click()
  await expect(page.getByRole('button', { name: /Esavalente\s*1ª dose/ })).toBeVisible()

  // Crescita: due misurazioni
  await page.goto('/growth')
  for (const [daysAgo, kg, cm] of [
    [30, '4,6', '55'],
    [0, '5,4', '58,5'],
  ] as const) {
    await page.getByRole('button', { name: 'Aggiungi misurazione' }).click()
    await page.getByLabel(/Peso/).fill(kg)
    await page.getByLabel(/Altezza/).fill(cm)
    const d = new Date(Date.now() - daysAgo * 86_400_000 - 3_600_000)
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
    await page.getByLabel('Giorno', { exact: true }).fill(local.slice(0, 10))
    await page.getByLabel('Data e ora').fill(local.slice(11))
    await page.getByRole('button', { name: 'Salva' }).click()
  }
  await expect(page.getByText('Percentile OMS')).toBeVisible()
  await expect(page.getByText(/\+800 g dalla precedente/)).toBeVisible()
  await shot(page, 'growth')

  // Modifica ed eliminazione dal diario
  await page.goto('/diary')
  await page.getByRole('tab', { name: 'Alimentazione' }).click()
  await page.getByRole('button', { name: /Biberon\s*120 ml/ }).click()
  await page.getByRole('button', { name: 'Modifica' }).click()
  await page.getByLabel('Quantità').fill('130')
  await page.getByRole('button', { name: 'Salva' }).click()
  await expect(page.getByRole('button', { name: /Biberon\s*130 ml/ })).toBeVisible()
  await page.getByRole('button', { name: /Biberon\s*130 ml/ }).click()
  await page.getByRole('button', { name: 'Elimina' }).click()
  await expect(page.getByRole('button', { name: /Biberon\s*130 ml/ })).toHaveCount(0)
  await page.getByRole('button', { name: 'Annulla' }).click()
  await expect(page.getByRole('button', { name: /Biberon\s*130 ml/ })).toBeVisible()
  await page.getByRole('tab', { name: 'Tutti' }).click()
  await shot(page, 'diary-all')

  // Statistiche
  await page.goto('/stats')
  await page.getByRole('radio', { name: 'Oggi' }).click()
  await expect(page.getByText(/^2 sessioni · 4\d min$/)).toBeVisible()
  await page.waitForTimeout(300)
  await shot(page, 'stats')

  // I dati sopravvivono al reload (cache IndexedDB + server)
  await page.reload()
  await page.getByRole('radio', { name: 'Oggi' }).click()
  await expect(page.getByText(/^2 sessioni · 4\d min$/)).toBeVisible()

  // Tema scuro
  await page.goto('/more')
  await page.getByRole('radio', { name: 'Scuro' }).click()
  await page.goto('/')
  await shot(page, 'home-dark')
  await page.goto('/stats')
  await shot(page, 'stats-dark')
  await page.goto('/growth')
  await shot(page, 'growth-dark')
})

test('layout su schermi piccoli (360px)', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 360, height: 740 }, locale: 'it-IT', hasTouch: true, isMobile: true })
  const page = await context.newPage()
  await signUp(page, 'Anna', uniqueEmail('small'))
  await createBaby(page, 'Leo')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(overflow).toBe(false)
  await page.screenshot({ path: 'test-results/screens/home-360.png' })
  await context.close()
})
