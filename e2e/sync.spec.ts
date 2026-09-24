import { expect, test } from '@playwright/test'
import { createBaby, newParent, signUp, uniqueEmail } from './helpers'

test('due genitori condividono il diario in tempo reale', async ({ browser }) => {
  const mom = await newParent(browser)
  const dad = await newParent(browser)

  // Mamma: registrazione + profilo bambino
  await signUp(mom.page, 'Giulia', uniqueEmail('mamma'))
  await createBaby(mom.page, 'Sofia')

  // Mamma: invito
  await mom.page.getByRole('navigation').getByRole('link', { name: 'Altro' }).click()
  await mom.page.getByRole('link', { name: /Genitori e caregiver/ }).click()
  await mom.page.getByRole('button', { name: "Crea link d'invito" }).click()
  const code = (await mom.page.getByLabel('Codice invito').textContent())!.replace(/-/g, '').trim()
  expect(code).toHaveLength(12)
  await mom.page.screenshot({ path: 'test-results/screens/invite.png' })
  await mom.page.goto('/')

  // Papà: apre il link, si registra e accetta
  await signUp(dad.page, 'Marco', uniqueEmail('papa'), `/invite/${code}`)
  await expect(dad.page.getByRole('heading', { name: 'Invito per Sofia' })).toBeVisible()
  await dad.page.getByRole('button', { name: 'Accetta invito' }).click()
  await expect(dad.page.getByText('Sofia', { exact: true }).first()).toBeVisible()

  // Mamma avvia l'allattamento (2 tap)
  await mom.page.getByRole('button', { name: 'Allattamento' }).first().click()
  await mom.page.getByRole('button', { name: /Sinistro/ }).click()
  await expect(mom.page.getByText('Allattamento in corso')).toBeVisible()

  // Papà lo vede senza refresh, con lato e chi l'ha avviato
  await expect(dad.page.getByText('Allattamento in corso')).toBeVisible()
  await expect(dad.page.getByText(/^Sinistro · \d\d:\d\d → \d\d:\d\d$/)).toBeVisible()
  await expect(dad.page.getByText('Avviato da Giulia')).toBeVisible()
  await dad.page.waitForTimeout(2200)
  await expect(dad.page.getByRole('timer')).not.toHaveText('00:00')
  await dad.page.screenshot({ path: 'test-results/screens/home-active-dad.png' })

  // La mamma va offline; il papà termina
  await mom.context.setOffline(true)
  await dad.page.getByRole('button', { name: 'Termina' }).click()
  await expect(dad.page.getByText('Allattamento in corso')).toBeHidden()

  // La mamma (offline) prova a terminare: nessun duplicato, il server segnala "già terminata"
  await mom.page.getByRole('button', { name: 'Termina' }).click()
  await expect(mom.page.getByText('Offline')).toBeVisible()
  await mom.context.setOffline(false)
  await expect(mom.page.getByText('Sessione già terminata')).toBeVisible()
  await expect(mom.page.getByText('Terminata da Marco')).toBeVisible()

  // Il papà, offline, registra un pannolino; torna online e la mamma lo riceve
  await dad.context.setOffline(true)
  await dad.page.getByRole('button', { name: 'Pannolino' }).first().click()
  await dad.page.getByRole('button', { name: 'Bagnato', exact: true }).click()
  await expect(dad.page.getByText('Pannolino registrato')).toBeVisible()
  await dad.context.setOffline(false)
  await expect(mom.page.getByRole('button', { name: /Pannolino\s*Bagnato/ })).toBeVisible()

  // Entrambi vedono un solo allattamento nel diario
  await mom.page.getByRole('navigation').getByRole('link', { name: 'Diario' }).click()
  await expect(mom.page.getByRole('button', { name: /Allattamento\s*Sinistro/ })).toHaveCount(1)
  await mom.page.screenshot({ path: 'test-results/screens/diary.png' })

  await mom.context.close()
  await dad.context.close()
})
