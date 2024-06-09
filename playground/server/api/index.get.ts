import type { ResultOf } from '@graphql-typed-document-node/core'
import { print } from 'graphql'

export default defineLazyEventHandler(() => {
  const endpoint = 'https://graphql-test.teages.xyz/graphql-user'

  const { gqf } = useGqfSchema(endpoint)
  const query = gqf('query FetchAnime', [{
    users: $ => $([
      'id',
      'name',
      '__typename',
    ]),
  }])

  return defineEventHandler(async () => {
    const { data } = await $fetch<{ data: ResultOf<typeof query> }>(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        query: print(query),
      },
    })

    return { data }
  })
})
