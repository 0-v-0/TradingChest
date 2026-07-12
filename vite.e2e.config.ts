import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'

export default defineConfig({
  plugins: [solidPlugin()],
  root: './e2e',
  server: {
    port: 5173,
    fs: {
      strict: false,
    },
  },
})
