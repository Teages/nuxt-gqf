import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { hash } from 'ohash'
import { type DocumentNode, Kind } from 'graphql'
import type { Endpoints } from '../internal/utils/schema'
import type { UseSchema } from './schema'
import { type AsyncData, type AsyncDataOptions, type KeysOf, type PickFrom, useAsyncData } from '#app/composables/asyncData'

export function withGqfClient<
  Context = unknown,
  Endpoint extends Endpoints = string,
>(
  schema: UseSchema<Endpoint>,
  request: ClientRequest<Context>,
): WithGqfClient<Context, Endpoint> {
  const url = schema.endpoint

  if (!url) {
    throw new Error('Endpoint is not defined')
  }

  return {
    defineOperation: (def, context) => {
      const document = typeof def === 'function' ? def(schema.gqf, schema.$enum) : def

      return (variables: any, contextRewrite: any) => request({
        document,
        variables,
        url,
        type: getDocumentType(document),
      }, {
        ...context,
        ...contextRewrite,
      })
    },
    defineAsyncOperation: (def, options) => {
      const document = typeof def === 'function' ? def(schema.gqf, schema.$enum) : def

      return (variables?: any, optionsRewrite?: any) => {
        const key = hash({ document, variables })
        const context = {
          ...options?.context,
          ...optionsRewrite?.context,
        }

        return useAsyncData(
          key,
          () => request({
            document,
            variables,
            url,
            type: getDocumentType(document),
          }, context),
          {
            ...options,
            ...optionsRewrite,
          },
        )
      }
    },
    defineLazyAsyncOperation: (def, options) => {
      const document = typeof def === 'function' ? def(schema.gqf, schema.$enum) : def

      return (variables?: any, optionsRewrite?: any) => {
        const key = hash({ document, variables })
        const context = {
          ...options?.context,
          ...optionsRewrite?.context,
        }

        return useAsyncData(
          key,
          () => request({
            document,
            variables,
            url,
            type: getDocumentType(document),
          }, context),
          {
            lazy: true,
            ...options,
            ...optionsRewrite,
          },
        )
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

export type ClientRequest<Context> = <
  TData,
  TVars extends Record<string, unknown>,
> (
  query: {
    document: TypedDocumentNode<TData, TVars>
    variables: TVars
    type: 'query' | 'mutation' | 'subscription'
    url: string
  },
  context?: Context
) => Promise<TData>

export interface WithGqfClient<
  Context,
  Endpoint extends Endpoints = string,
> {
  defineOperation: DefineOperation<Context, Endpoint>
  defineAsyncOperation: DefineAsyncOperation<Context, Endpoint>
  defineLazyAsyncOperation: DefineAsyncOperation<Context, Endpoint>
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
    options?: AsyncDataOptions<TData | undefined, DataT, PickKeys, DefaultT> & { context?: Context },
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
    options?: AsyncDataOptions<TData | undefined, DataT, PickKeys, DefaultT> & { context?: Context },
  ): DefineAsyncOperationReturn<
    AsyncData<PickFrom<DataT, PickKeys> | DefaultT, Error | null>,
    TVars,
    AsyncDataOptions<TData | undefined, DataT, PickKeys, DefaultT> & { context?: Context }
  >
}

type DefineOperationReturn<Ret, TVars, Context> =
  Record<string, never> extends TVars
    ? (variables?: TVars, context?: Context) => Ret
    : (variables: TVars, context?: Context) => Ret

type DefineAsyncOperationReturn<Ret, TVars, Options> =
  Record<string, never> extends TVars
    ? (variables?: TVars, options?: Options) => Ret
    : (variables: TVars, options?: Options) => Ret
