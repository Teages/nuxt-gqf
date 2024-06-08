import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { print } from 'graphql'
import { createClient as createWSClient } from 'graphql-ws'
import { createClient as createSSEClient } from 'graphql-sse'
import { GraphQLClient } from 'graphql-request'

export function subscribeSSERequest<
  TData,
  TVars extends Record<string, unknown>,
>(
  func: {
    update: (data: TData) => void
    onUnsubscribe: (fn: () => void) => void
    close: (error?: any) => void
  },
  query: {
    document: TypedDocumentNode<TData, TVars>
    variables: TVars
    type: 'subscription'
    url: string
  },
  _context: any,
) {
  const client = createSSEClient({
    url: query.url,
  });

  (async () => {
    const subscription = client.iterate<TData, TVars>({
      query: print(query.document),
      variables: query.variables,
    })
    func.onUnsubscribe(() => {
      subscription.return?.()
    })

    for await (const result of subscription) {
      if (result.data) {
        func.update(result.data)
      }
    }

    func.close()
  })()
}

export function subscribeWSRequest<
  TData,
  TVars extends Record<string, unknown>,
>(
  func: {
    update: (data: TData) => void
    onUnsubscribe: (fn: () => void) => void
    close: (error?: any) => void
  },
  query: {
    document: TypedDocumentNode<TData, TVars>
    variables: TVars
    type: 'subscription'
    url: string
  },
  _context: any,
) {
  const client = createWSClient({
    url: query.url,
  });

  (async () => {
    const subscription = client.iterate<TData, TVars>({
      query: print(query.document),
      variables: query.variables,
    })
    func.onUnsubscribe(() => {
      subscription.return?.()
    })

    for await (const result of subscription) {
      if (result.data) {
        func.update(result.data)
      }
    }

    func.close()
  })()
}

export function request<
  TData,
  TVars extends Record<string, unknown>,
>(
  query: {
    document: TypedDocumentNode<TData, TVars>
    variables: TVars
    type: 'query' | 'mutation'
    url: string
  },
) {
  const client = new GraphQLClient(query.url, {
    fetch: (input, init) => $fetch.raw(
      input.toString(),
      {
        ...init as any,
        responseType: 'stream',
      },
    ),
  })

  // @ts-expect-error ignore var not match error
  return client.request(query.document, query.variables)
}
