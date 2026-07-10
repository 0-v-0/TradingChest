import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'

export default defineConfig({
  plugins: [solidPlugin()],
  server: {
    fs: {
      strict: false
    }
  },
  build: {
    cssTarget: 'chrome61',
    sourcemap: false,
    rollupOptions: {
      external: ['klinecharts'],
      output: {
        assetFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'style.css') {
            return 'trading-chest.css'
          }
          return '[name][extname]'
        },
        globals: {
          klinecharts: 'klinecharts'
        },
      },
    },
    lib: {
      entry: './src/index.ts',
      name: 'tradingchest',
      fileName: (format) => {
        if (format === 'es') {
          return 'trading-chest.js'
        }
        if (format === 'umd') {
          return 'trading-chest.umd.js'
        }
      }
    }
  },
  test: {
    // Default to 'node' for pure-logic tests.
    // Use `// @vitest-environment jsdom` per-file for component tests.
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/**/__tests__/**', 'src/index.ts', 'src/**/*.d.ts']
    }
  }
})
