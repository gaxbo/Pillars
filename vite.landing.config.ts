import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

/**
 * The landing page: its own site, built from `landing/`, sharing the app's
 * tokens, components, and `.env`. Deployed separately so the app can stay
 * private until launch.
 */
export default defineConfig({
  root: 'landing',
  envDir: '..',
  publicDir: 'public',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: '../dist-landing',
    emptyOutDir: true,
  },
  server: {
    port: 5180,
    strictPort: true,
  },
  preview: {
    port: 5181,
    strictPort: true,
  },
})
