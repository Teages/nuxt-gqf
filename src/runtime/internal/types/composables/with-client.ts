import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { ComputedRef } from 'vue'
import type { Endpoints } from '../../utils/schema'
import type { UseSchema } from './schema'
import type { AsyncData, AsyncDataOptions, KeysOf, PickFrom } from '#app/composables/asyncData'
import type { Ref } from '#imports'

export type RequestHandler<Context> = <
  TData,
  TVars extends Record<string, unknown>,
> (
  query: {
    document: TypedDocumentNode<TData, TVars>
    variables: NoInfer<TVars>
    type: 'query' | 'mutation'
    url: string
  },
  context?: Context
) => Promise<TData>

export type SubscriptionHandler<Context> = <
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
    variables: NoInfer<TVars>
    type: 'subscription'
    url: string
  },
  context?: Context
) => void

export interface WithGqfClient<
  Context,
  Endpoint extends Endpoints = string,
> {
  defineOperation: DefineOperation<Context, Endpoint>
  defineAsyncOperation: DefineAsyncOperation<Context, Endpoint>
  defineLazyAsyncOperation: DefineAsyncOperation<Context, Endpoint>
  defineSubscription: DefineSubscription<Context, Endpoint>
}

export interface DefineOperation<
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

export interface DefineAsyncOperation<
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

export interface DefineSubscription<
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

export type DefineOperationReturn<Ret, TVars, Context> =
  Record<string, never> extends TVars
    ? (variables?: TVars, context?: Context) => Ret
    : (variables: TVars, context?: Context) => Ret

export type DefineAsyncOperationReturn<Ret, TVars, Options> =
  Record<string, never> extends TVars
    ? DefineAsyncOperationReturnFnE<Ret, TVars, Options>
    : DefineAsyncOperationReturnFn<Ret, TVars, Options>

export interface DefineAsyncOperationReturnFn<Ret, TVars, Options> {
  (
    variables: TVars,
    options?: Omit<Options, 'watch'> // Force to use getter if watched.
  ): Ret
  (
    variables: Ref<TVars> | (() => TVars),
    options?: Options
  ): Ret
}
export interface DefineAsyncOperationReturnFnE<Ret, TVars, Options> {
  (
    variables?: TVars,
    options?: Omit<Options, 'watch'> // Force to use getter if watched.
  ): Ret
  (
    variables?: Ref<TVars> | (() => TVars),
    options?: Options
  ): Ret
}

export type DefineSubscriptionReturn<Ret, TVars, Context> =
  Record<string, never> extends TVars
    ? (variables?: TVars, options?: Context) => Promise<SubscriptionReturn<Ret>>
    : (variables: TVars, options?: Context) => Promise<SubscriptionReturn<Ret>>

export interface SubscriptionReturn<TData> {
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
