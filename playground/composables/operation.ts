import { request } from 'graphql-request'

const endpoint = 'https://graphql-test.teages.xyz/graphql-user'

const schema = useSchema(endpoint)
const { defineAsyncOperation } = withGqfClient(
  schema,
  ({ url, document, variables }, _context) => {
    // @ts-expect-error ignore var not match error
    return request({ url, document, variables })
  },
)

export const userFragment = schema
  .gqp('fragment UserFragment', 'on User', [
    'name',
    'id',
  ])
export type RequireUserFragment = RequireQueryPart<typeof userFragment>

export const useAsyncUser = defineAsyncOperation(
  gqf => gqf('query QueryUser', {
    id: 'ID',
  }, [{
    user: $ => $({ id: $.id }, [{ ...userFragment($) }]),
  }]),
)
