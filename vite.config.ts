/// <reference types="node" />

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { cwd } from 'node:process'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // The global `process` object is available in the Node.js environment where this config is executed.
  const env = loadEnv(mode, cwd(), '');
  return {
    server: {
      host: true, // Listen on all public IPs
    },
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    define: {
      'process.env': env
    }
  }
})
