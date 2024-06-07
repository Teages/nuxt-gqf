import type { $enum } from '@teages/gqf'
import { useSchema as _useSchema } from '@teages/gqf'
import type { LoadFromUrl } from '@teages/gqf/cli'
import type { GraphQueryFunction, GraphQueryPartial } from '@teages/gqf/typed'
import type { gqf, gqp } from '@teages/gqf/core'
import type { Endpoints } from '../internal/utils/schema'

type DollarEnum = typeof $enum

type LoadGQF<T extends Endpoints> = LoadFromUrl<T> extends undefined
  ? typeof gqf
  : GraphQueryFunction<NonNullable<LoadFromUrl<T>>>

type LoadGQP<T extends Endpoints> = LoadFromUrl<T> extends undefined
  ? typeof gqp
  : GraphQueryPartial<NonNullable<LoadFromUrl<T>>>

export interface UseSchema<
  TEndpoint extends Endpoints,
> {
  endpoint?: TEndpoint
  gqf: LoadGQF<TEndpoint>
  gqp: LoadGQP<TEndpoint>
  $enum: typeof $enum
}

export function useSchema<T extends Endpoints>(endpoint?: T): UseSchema<T> {
  if (import.meta.dev && endpoint) {
    // Check if the schema is defined in the config
    (async () => {
      const config: any = (await import('#build/gqf.config.mjs')).default
      if (!config || config.warnNotFound) {
        const clients: string[] = config?.clients || []
        if (!clients.includes(endpoint)) {
          console.warn(`Schema for "${endpoint}" is not typed, please add it to gqf.clients in your nuxt config`)
        }
      }
    })()
  }

  const schema = _useSchema(endpoint) as {
    gqf: LoadGQF<T>
    gqp: LoadGQP<T>
    $enum: DollarEnum
  }

  return {
    ...schema,
    endpoint,
  }
}
