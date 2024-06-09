const endpoint = 'https://graphql-test.teages.xyz/graphql-user'
const schema = useGqfSchema(endpoint)
const { defineAsyncQuery } = withGqfClient(
  schema,
)

export const userFragment = schema
  .gqp('fragment UserFragment', 'on User', [
    'name',
    'id',
  ])
export type RequireUserFragment = RequireQueryPart<typeof userFragment>

export const useAsyncUser = defineAsyncQuery(
  gqf => gqf('query QueryUser', {
    id: 'ID',
  }, [{
    user: $ => $({ id: $.id }, [{ ...userFragment($) }]),
  }]),
)

export const useHello = defineAsyncQuery(
  gqf => gqf('query QueryHello', {
    name: 'String',
  }, [{
    hello: $ => $({ name: $.name }, true),
  }]),
)
