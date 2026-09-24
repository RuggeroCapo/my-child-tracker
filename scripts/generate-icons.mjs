// Genera le icone PWA (PNG) a partire dall'SVG del logo usando Chromium (Playwright).
// Uso: node scripts/generate-icons.mjs
import { chromium } from '@playwright/test'
import { writeFile } from 'node:fs/promises'

const heart =
  'M32 47c-1 0-12-7.2-14.6-13.3C15.3 28.8 18 23 23.6 23c3.4 0 5.6 2 6.9 4 .7 1 2.3 1 3 0 1.3-2 3.5-4 6.9-4 5.6 0 8.3 5.8 6.2 10.7C44 39.8 33 47 32 47Z'

/** radius: angoli (0 = quadrato pieno); scale: dimensione del cuore (maskable → più piccolo). */
function svg({ radius, scale }) {
  const t = 32 - 32 * scale
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF8FA6"/><stop offset="1" stop-color="#FF6B8B"/></linearGradient></defs>
  <rect width="64" height="64" rx="${radius}" fill="url(#g)"/>
  <g transform="translate(${t} ${t}) scale(${scale})"><path d="${heart}" fill="#fff"/><circle cx="32" cy="35" r="3.2" fill="#FF6B8B" opacity=".35"/></g>
</svg>`
}

const targets = [
  { file: 'public/pwa-192x192.png', size: 192, radius: 14, scale: 1 },
  { file: 'public/pwa-512x512.png', size: 512, radius: 14, scale: 1 },
  { file: 'public/maskable-512x512.png', size: 512, radius: 0, scale: 0.8 },
  { file: 'public/apple-touch-icon.png', size: 180, radius: 0, scale: 0.9 },
]

await writeFile('public/favicon.svg', svg({ radius: 16, scale: 1 }))

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined })
const page = await browser.newPage()
for (const t of targets) {
  await page.setViewportSize({ width: t.size, height: t.size })
  await page.setContent(
    `<html><body style="margin:0;background:transparent">${svg(t).replace('<svg ', `<svg width="${t.size}" height="${t.size}" `)}</body></html>`,
  )
  await page.locator('svg').screenshot({ path: t.file, omitBackground: true })
  console.log('✓', t.file)
}
await browser.close()
