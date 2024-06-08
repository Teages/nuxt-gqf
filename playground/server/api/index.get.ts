import { request } from 'graphql-request'

export default defineLazyEventHandler(() => {
  const endpoint = 'https://graphql.anilist.co'

  const { gqf, $enum } = useSchema(endpoint)
  const query = gqf('query FetchAnime', {
    id: 'Int!',
  }, [{
    Media: $ => $({ id: $.id, type: $enum('ANIME') }, [
      'id',
      {
        title: $ => $([
          'romaji',
          'english',
          'native',
        ]),
      },
    ]),
  }])

  return defineEventHandler(async () => {
    const { Media } = await request({
      url: endpoint,
      document: query,
      variables: {
        id: 147864,
      },
    })

    return { data: Media }
  })
})
