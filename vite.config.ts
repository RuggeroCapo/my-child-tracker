/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'Bebè — Diario condiviso',
        short_name: 'Bebè',
        description: 'Diario condiviso per i momenti più importanti del tuo bambino.',
        lang: 'it',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FFF8F5',
        theme_color: '#FFF8F5',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Solo i sottoinsiemi del font usati dall'italiano.
        globIgnores: ['**/*cyrillic*', '**/*greek*', '**/*vietnamese*'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/auth\//],
        cleanupOutdatedCaches: true,
        // I dati vivono in IndexedDB (store locale + coda offline): le API
        // Supabase non vengono mai servite dalla cache del service worker.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/rest/') || url.pathname.startsWith('/auth/'),
            handler: 'NetworkOnly',
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5173 },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
