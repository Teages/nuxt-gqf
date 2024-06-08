import NuxtGQF from '../../../src/module'

export default defineNuxtConfig({
  modules: [NuxtGQF],
  gqf: {
    clients: [
      'https://graphql-test.teages.xyz/graphql-user',
    ],
  },
})
