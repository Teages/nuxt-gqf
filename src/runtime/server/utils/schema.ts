import type { $enum } from '@teages/gqf'
import { useSchema as _useSchema } from '@teages/gqf'
import type { LoadFromUrl } from '@teages/gqf/cli'
import type { GraphQueryFunction, GraphQueryPartial } from '@teages/gqf/typed'
import type { gqf, gqp } from '@teages/gqf/core'
import type { Endpoints, ExactEndpoints } from '../../internal/utils/schema'

type DollarEnum = typeof $enum

type LoadServerGQF<T extends Endpoints> = LoadFromUrl<T> extends undefined
  ? typeof gqf
  : GraphQueryFunction<NonNullable<LoadFromUrl<T>>>

type LoadServerGQP<T extends Endpoints> = LoadFromUrl<T> extends undefined
  ? typeof gqp
  : GraphQueryPartial<NonNullable<LoadFromUrl<T>>>

export interface ServerUseSchema<
  TEndpoint extends Endpoints,
> {
  endpoint?: TEndpoint
  gqf: LoadServerGQF<TEndpoint>
  gqp: LoadServerGQP<TEndpoint>
  $enum: typeof $enum
}

export function useSchema(): ServerUseSchema<string>
export function useSchema<T extends ExactEndpoints>(endpoint?: T): ServerUseSchema<T>
export function useSchema<T extends Endpoints>(endpoint?: T): ServerUseSchema<T> {
  const schema = _useSchema(endpoint) as {
    gqf: LoadServerGQF<T>
    gqp: LoadServerGQP<T>
    $enum: DollarEnum
  }

  return {
    ...schema,
    endpoint,
  }
}
