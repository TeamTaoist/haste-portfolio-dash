import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

import { sentryVitePlugin } from "@sentry/vite-plugin";

import reactRefresh from '@vitejs/plugin-react-refresh';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    sourcemap: true, // Source map generation must be turned on
  },
  plugins: [
    sentryVitePlugin({
      org: "taoistlabs",
      project: "haste-portfolio-dash",
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
      nodePolyfills(),react(),reactRefresh()],
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis'
      },
    }
  }
})
