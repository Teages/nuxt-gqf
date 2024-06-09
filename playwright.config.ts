import { fileURLToPath } from 'node:url'
import { defineConfig } from '@playwright/test'
import type { ConfigOptions } from '@nuxt/test-utils/playwright'

export default defineConfig<ConfigOptions>({
  use: {
    nuxt: {
      rootDir: fileURLToPath(new URL('./test/fixtures/subscription', import.meta.url)),
    },
  },
  testMatch: '**/*.pw-test.ts',
})
