/// <reference types="vitest/config" />
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    // apiClient's baseUrl is '' by design (resolves relative to the page origin in a real
    // browser). Node's fetch has no page origin to resolve a relative URL against — MSW never
    // gets a chance to intercept, since fetch() itself throws first. An absolute (unreachable,
    // but well-formed) base is enough for MSW's Node interceptor to catch every request.
    env: { VITE_API_BASE: 'http://localhost.invalid' },
  },
})
