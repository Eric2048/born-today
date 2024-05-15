/// <reference types="vitest" />
/// <reference types="vite/client" />

// ^^^ Added those to allow addition of 'test' in the below config.
// From example: https://github.com/vitest-dev/vitest/blob/main/examples/react-testing-lib/vite.config.ts

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// See https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  test: {
    globals: true,
    setupFiles: 'src/test/setup.ts',
    // Could disable CSS parsing for better performance
    // css: false
  },

  build: {
    chunkSizeWarningLimit: 1600
  }
})
