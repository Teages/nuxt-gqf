import type { $enum } from '@teages/gqf'
import { useSchema as _useSchema } from '@teages/gqf'
import type { DollarEnum, Endpoints, ExactEndpoints, LoadGQF, LoadGQP } from '../../internal/utils/schema'

export type { RequireQueryPart, ResultOf, VariablesOf } from '@teages/gqf'

export interface ServerUseSchema<
  TEndpoint extends Endpoints,
> {
  endpoint?: TEndpoint
  gqf: LoadGQF<TEndpoint>
  gqp: LoadGQP<TEndpoint>
  $enum: typeof $enum
}

export interface ServerUseSchemaWithWarning {
  endpoint?: string
  /**
   * @deprecated The schema is not typed.
   */
  gqf: LoadGQF<string>
  /**
   * @deprecated The schema is not typed.
   */
  gqp: LoadGQP<string>
  $enum: typeof $enum
}

export function useSchema(): ServerUseSchema<string>
export function useSchema<T extends ExactEndpoints>(endpoint: T): ServerUseSchema<T>
export function useSchema(endpoint: string): ServerUseSchemaWithWarning
export function useSchema<T extends Endpoints>(endpoint?: T): ServerUseSchema<T> {
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
