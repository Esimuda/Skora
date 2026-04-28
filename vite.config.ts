import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Skora RMS',
        short_name: 'Skora',
        description: 'School Result Management System — The Academic Ledger for Educators',
        theme_color: '#1a6b4a',
        background_color: '#fafdf6',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icons/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/icons/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Cache all static build assets
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2,ico}'],

        // Don't let the precache grow unbounded
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,

        runtimeCaching: [
          // Google Fonts stylesheets
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Google Fonts / Material Symbols font files
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // API GET requests — NetworkFirst: fresh data when online, cached when offline
          {
            urlPattern: ({ url, request }: { url: URL; request: Request }) =>
              url.pathname.startsWith('/api') && request.method === 'GET',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-get-cache',
              networkTimeoutSeconds: 8,
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: { statuses: [200] },
            },
          },
          // External API URL (production backend on Render/Railway/etc.)
          {
            urlPattern: ({ request }: { request: Request }) =>
              request.method === 'GET' &&
              request.url.includes('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'external-api-get-cache',
              networkTimeoutSeconds: 8,
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24,
              },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],

        // Allow the SW to take control immediately (no waiting for reload)
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
