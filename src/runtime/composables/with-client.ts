import type { ResultOf, TypedDocumentNode } from '@graphql-typed-document-node/core'
import { hash } from 'ohash'
import { type DocumentNode, Kind } from 'graphql'
import type { ComputedRef } from 'vue'
import type { Endpoints } from '../internal/utils/schema'
import { request, subscribeSSERequest, subscribeWSRequest } from '../internal/utils/client'
import type { UseSchema } from './schema'
import { type AsyncData, type AsyncDataOptions, type KeysOf, type PickFrom, useAsyncData } from '#app/composables/asyncData'
import { useState } from '#app'
import { readonly, watch } from '#imports'

export function withGqfClient<
  Context = unknown,
  Endpoint extends Endpoints = string,
>(
  schema: UseSchema<Endpoint>,
  /**
   * Custom request handler.
   * By default it send the request using package `graphql-request` with `$fetch`.
   */
  handler: RequestHandler<Context> = request,
  /**
   * Custom subscription handler.
   * By default it uses package `graphql-sse`.
   * - `sse`: use `graphql-sse` package.
   * - `ws`: use `graphql-ws` package.
   * - `SubscriptionHandler<Context>`: use custom subscription handler.
   */
  subscriptionHandler: SubscriptionHandler<Context> | 'sse' | 'ws' = 'sse',
): WithGqfClient<Context, Endpoint> {
  const url = schema.endpoint

  if (!url) {
    throw new Error('Endpoint is not defined')
  }

  return {
    defineOperation: (def, context) => {
      const document = typeof def === 'function' ? def(schema.gqf, schema.$enum) : def
      const type = getDocumentType(document)
      if (type === 'subscription') {
        throw new Error('Subscriptions are not supported')
      }

      return (variables?: any, contextRewrite?: any) => handler(
        { document, variables, url, type },
        {
          ...context,
          ...contextRewrite,
        },
      )
    },
    defineAsyncOperation: (def, context) => {
      const document = typeof def === 'function' ? def(schema.gqf, schema.$enum) : def
      const type = getDocumentType(document)
      if (type === 'subscription') {
        throw new Error('Subscriptions are not supported')
      }

      return (variables?: any, options?: any) => {
        const key = hash({ document, variables })

        return useAsyncData(
          key,
          () => handler(
            { document, variables, url, type },
            {
              ...context,
              ...options?.context,
            },
          ),
          options,
        )
      }
    },
    defineLazyAsyncOperation: (def, context) => {
      const document = typeof def === 'function' ? def(schema.gqf, schema.$enum) : def
      const type = getDocumentType(document)
      if (type === 'subscription') {
        throw new Error('Subscriptions are not supported')
      }

      return (variables?: any, options?: any) => {
        const key = hash({ document, variables })

        return useAsyncData(
          key,
          () => handler(
            { document, variables, url, type },
            {
              ...context,
              ...options?.context,
            },
          ),
          {
            lazy: true,
            ...options,
          },
        )
      }
    },
    defineSubscription: (def, context) => {
      const document = typeof def === 'function' ? def(schema.gqf, schema.$enum) : def
      const type = getDocumentType(document)
      if (type !== 'subscription') {
        throw new Error('Operation is not a subscription')
      }

      const handler = typeof subscriptionHandler === 'function'
        ? subscriptionHandler
        : subscriptionHandler === 'ws'
          ? subscribeWSRequest
          : subscribeSSERequest
      return async (variables?: any, contextRewrite?: any) => {
        const key = hash({ document, variables })
        const cache = useState<ResultOf<typeof document> | undefined>(key, () => undefined)
        const error = useState<Error | null>(`${key}-error`, () => null)
        const state = useState<'pending' | 'connected' | 'closed'>(`${key}-state`, () => 'pending')

        const hooks = {
          onUnsubscribe: [] as Array<() => void>,
        }

        const close = () => {
          state.value = 'closed'
          try {
            hooks.onUnsubscribe.forEach(fn => fn())
          }
          catch (error) { /* ignore */ }
        }

        const update = (
          data: ResultOf<typeof document>,
          isFinal: boolean = false,
        ) => {
          if (state.value === 'closed') {
            if (import.meta.dev) {
              console.warn('Subscription is already closed')
            }
            return
          }
          if (state.value === 'pending') {
            state.value = 'connected'
          }

          cache.value = data
          if (isFinal) {
            close()
          }
        }

        const onUnsubscribe = (fn: () => void) => {
          hooks.onUnsubscribe.push(fn)
        }

        const unsubscribe = () => {
          close()
        }

        const restart = () => new Promise<void>((resolve, reject) => {
          // disconnect previous subscription
          if (state.value === 'connected') {
            unsubscribe()
          }

          // if already closed, reset hooks and state
          if (state.value === 'closed') {
            hooks.onUnsubscribe = []
            state.value = 'pending'
          }

          // subscription should only be used in the browser
          // to avoid duplicated requests
          if (!import.meta.client) {
            return resolve()
          }

          // watch the state, resolve the promise when got the first data
          watch(state, (val) => {
            if (val === 'connected') {
              resolve()
            }
          }, { once: true })

          // start the subscription
          error.value = null
          try {
            handler(
              { update, onUnsubscribe, close },
              { document, variables, url, type },
              {
                ...context,
                ...contextRewrite,
              },
            )
          }
          catch (error) {
            reject(error)
          }
        })

        const refresh = () => new Promise<void>((resolve, reject) => {
          if (state.value === 'pending') {
            if (import.meta.dev) {
              console.warn('Subscription is not started yet')
            }
            return resolve()
          }
          if (state.value === 'closed') {
            restart()
              .then(() => resolve())
              .catch(reject)
          }

          // dry close
          const oldUnsubscribe = [...hooks.onUnsubscribe]
          state.value = 'closed'

          restart()
            .then(() => {
              resolve()
              // close previous subscription
              try {
                oldUnsubscribe.forEach(fn => fn())
              }
              catch (error) { /* ignore */ }
            })
            .catch(reject)
        })

        await restart()

        return {
          state: readonly(state) as ComputedRef<'pending' | 'connected' | 'closed'>,
          data: readonly(cache) as ComputedRef<ResultOf<typeof document> | undefined>,
          error: readonly(error) as ComputedRef<Error | null>,
          unsubscribe,
          refresh,
          restart,
        }
      }
    },
  }
}

function getDocumentType(doc: DocumentNode) {
  let type: 'query' | 'mutation' | 'subscription' | undefined

  doc.definitions.forEach((def) => {
    if (def.kind === Kind.OPERATION_DEFINITION) {
      if (type !== undefined) {
        throw new Error('Multiple operation definitions in document')
      }
      type = def.operation
    }
  })

  if (!type) {
    throw new Error('Unrecognizable document type')
  }

  return type
}

type RequestHandler<Context> = <
  TData,
  TVars extends Record<string, unknown>,
> (
  query: {
    document: TypedDocumentNode<TData, TVars>
    variables: TVars
    type: 'query' | 'mutation'
    url: string
  },
  context?: Context
) => Promise<TData>

type SubscriptionHandler<Context> = <
  TData,
  TVars extends Record<string, unknown>,
> (
  func: {
    update: (data: TData, isFinal?: boolean) => void
    close: (error?: any) => void
    onUnsubscribe: (fn: () => void) => void
  },
  query: {
    document: TypedDocumentNode<TData, TVars>
    variables: TVars
    type: 'subscription'
    url: string
  },
  context?: Context
) => void

interface WithGqfClient<
  Context,
  Endpoint extends Endpoints = string,
> {
  defineOperation: DefineOperation<Context, Endpoint>
  defineAsyncOperation: DefineAsyncOperation<Context, Endpoint>
  defineLazyAsyncOperation: DefineAsyncOperation<Context, Endpoint>
  defineSubscription: DefineSubscription<Context, Endpoint>
}

interface DefineOperation<
  Context,
  Endpoint extends Endpoints = string,
> {
  <TData, TVars extends Record<string, unknown>>(
    def: (
      | ((
        gqf: UseSchema<Endpoint>['gqf'],
        $enum: UseSchema<Endpoint>['$enum'],
      ) => TypedDocumentNode<TData, TVars>)
      | TypedDocumentNode<TData, TVars>
    ),
    context?: Context,
  ): DefineOperationReturn<Promise<TData>, TVars, Context>
}

interface DefineAsyncOperation<
  Context,
  Endpoint extends Endpoints = string,
> {
  <
    TData,
    TVars extends Record<string, unknown>,
    DataT = TData | undefined,
    PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
    DefaultT = null,
  > (
    def: (
      | ((
        gqf: UseSchema<Endpoint>['gqf'],
        $enum: UseSchema<Endpoint>['$enum'],
      ) => TypedDocumentNode<TData, TVars>)
      | TypedDocumentNode<TData, TVars>
    ),
    context?: Context,
  ): DefineAsyncOperationReturn<
    AsyncData<PickFrom<DataT, PickKeys> | DefaultT, Error | null>,
    TVars,
    AsyncDataOptions<TData | undefined, DataT, PickKeys, DefaultT> & { context?: Context }
  >

  <
    TData,
    TVars extends Record<string, unknown>,
    DataT = TData | undefined,
    PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
    DefaultT = DataT,
  > (
    def: (
      | ((
        gqf: UseSchema<Endpoint>['gqf'],
        $enum: UseSchema<Endpoint>['$enum'],
      ) => TypedDocumentNode<TData, TVars>)
      | TypedDocumentNode<TData, TVars>
    ),
    context?: Context,
  ): DefineAsyncOperationReturn<
    AsyncData<PickFrom<DataT, PickKeys> | DefaultT, Error | null>,
    TVars,
    AsyncDataOptions<TData | undefined, DataT, PickKeys, DefaultT> & { context?: Context }
  >
}

interface DefineSubscription<
  Context,
  Endpoint extends Endpoints = string,
> {
  <TData, TVars extends Record<string, unknown>>(
    def: (
      | ((
        gqf: UseSchema<Endpoint>['gqf'],
        $enum: UseSchema<Endpoint>['$enum'],
      ) => TypedDocumentNode<TData, TVars>)
      | TypedDocumentNode<TData, TVars>
    ),
    context?: Context,
  ): DefineSubscriptionReturn<TData, TVars, Context>
}

type DefineOperationReturn<Ret, TVars, Context> =
  Record<string, never> extends TVars
    ? (variables?: TVars, context?: Context) => Ret
    : (variables: TVars, context?: Context) => Ret

type DefineAsyncOperationReturn<Ret, TVars, Options> =
  Record<string, never> extends TVars
    ? (variables?: TVars, options?: Options) => Ret
    : (variables: TVars, options?: Options) => Ret

type DefineSubscriptionReturn<Ret, TVars, Context> =
  Record<string, never> extends TVars
    ? (variables?: TVars, options?: Context) => Promise<SubscriptionReturn<Ret>>
    : (variables: TVars, options?: Context) => Promise<SubscriptionReturn<Ret>>

interface SubscriptionReturn<TData> {
  state: ComputedRef<'pending' | 'connected' | 'closed'>
  data: ComputedRef<TData | undefined>
  error: ComputedRef<Error | null>
  unsubscribe: () => void
  /**
   * Close the current subscription and reconnect.
   */
  restart: () => Promise<void>
  /**
   * Keep the current subscription alive and seamless switch to a new one.
   * This is useful when you have a connection time limit.
   */
  refresh: () => Promise<void>
}
