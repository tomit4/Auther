/// <reference types="vitest" />
import { mergeConfig } from 'vite'
import { configDefaults, defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import viteConfig from './vite.config'

// https://vitejs.dev/config/
export default mergeConfig(
    viteConfig,
    defineConfig({
        test: {
            environment: 'jsdom',
            exclude: [...configDefaults.exclude, 'e2e/*'],
            root: fileURLToPath(new URL('./', import.meta.url)),
            // setupFiles: './src/tests/setup.ts',
            setupFiles: './vitest.setup.ts',
        },
    }),
)
