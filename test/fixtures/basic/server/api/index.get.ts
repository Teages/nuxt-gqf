import { request } from 'graphql-request'

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
    const { users } = await request({
      url: endpoint,
      document: query,
    })

    return { data: users }
  })
})
