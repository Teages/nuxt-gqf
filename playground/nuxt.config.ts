export default defineNuxtConfig({
  modules: ['../src/module'],
  gqf: {
    clients: [
      'https://graphql.anilist.co',
    ],
  },
  devtools: { enabled: true },
})
