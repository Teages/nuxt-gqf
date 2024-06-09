import type { ResultOf, TypedDocumentNode, VariablesOf } from '@graphql-typed-document-node/core'
import { print } from 'graphql'
import { type ClientOptions as WSClientOptions, createClient as createWSClient } from 'graphql-ws'
import { destr } from 'destr'
import type { FetchOptions } from 'ofetch'

export function createHandler(options: FetchOptions) {
  return async <
    TData,
    TVars extends Record<string, unknown>,
  > (
    query: {
      document: TypedDocumentNode<TData, TVars>
      variables: TVars
      type: 'query' | 'mutation'
      url: string
    },
    context: FetchOptions,
  ) => {
    const headers = {
      ...options.headers,
      ...context.headers,
      'Content-Type': 'application/json',
    }
    const res = await $fetch<{ data: TData }>(query.url, {
      ...options,
      ...context,
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: print(query.document),
        variables: query.variables,
      }),
    })
    return res.data
  }
}

export function createSubscriptionHandler(
  options: CreateSubscriptionHandlerOptions,
): SubscriptionHandler {
  if (options.type === 'WS') {
    return (func, query, context?: WSOptions) => {
      const client = createWSClient({
        ...context,
        url: query.url,
      });

      (async () => {
        const subscription = client.iterate<
          ResultOf<typeof query.document>,
          VariablesOf<typeof query.document>
        >({
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
  }
  return (func, query, context?: SSEOptions) => {
    const url = new URL(query.url)
    url.searchParams.set('query', print(query.document))
    url.searchParams.set('variables', JSON.stringify(query.variables ?? {}))

    const source = new EventSource(url, context)

    source.addEventListener('next', ({ data }) => {
      func.update(
        destr<{ data: ResultOf<typeof query.document> }>(data).data,
      )
    })
    source.addEventListener('error', (e) => {
      func.close(e)
      source.close()
    })
    source.addEventListener('complete', () => {
      func.close()
      source.close()
    })
  }
}

export type CreateSubscriptionHandlerOptions = {
  type?: 'SSE'
  sseOptions?: SSEOptions
} | {
  type: 'WS'
  wsOptions?: WSOptions
}

export type HandlerOptions = FetchOptions

export type SSEOptions = EventSourceInit

export type WSOptions = Omit<WSClientOptions, 'url'>

export type SubscriptionHandler = <
  TData,
  TVars extends Record<string, unknown>,
> (
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
  context?: any,
) => void
