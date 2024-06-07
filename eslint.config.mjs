// @ts-check
import { createConfigForNuxt } from '@nuxt/eslint-config/flat'
import antfu from '@antfu/eslint-config'

// Run `npx @eslint/config-inspector` to inspect the resolved config interactively
export default createConfigForNuxt({
  features: {
    standalone: false,
    tooling: true,
  },
  dirs: {
    src: [
      './playground',
    ],
  },
})
  .append({
    // conflict with changelogen: remove after https://github.com/unjs/changelogen/issues/170
    files: ['package.json'],
    name: 'teages/changelogen-package-json',
    rules: {
      'style/eol-last': ['error', 'never'],
    },
  })
  .append(antfu(
    {},
    {
      rules: {
        curly: ['error', 'all'],
      },
    },
  ))
