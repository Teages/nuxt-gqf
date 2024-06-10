import type { $enum } from '@teages/gqf'
import { useSchema } from '@teages/gqf'
import type { DollarEnum, Endpoints, ExactEndpoints, LoadGQF, LoadGQP } from '../../internal/utils/schema'

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

export function useGqfSchema(): ServerUseSchema<string>
export function useGqfSchema<T extends ExactEndpoints>(endpoint: T): ServerUseSchema<T>
export function useGqfSchema(endpoint: string): ServerUseSchemaWithWarning
export function useGqfSchema<T extends Endpoints>(endpoint?: T): ServerUseSchema<T> {
  const schema = useSchema(endpoint) as {
    gqf: LoadGQF<T>
    gqp: LoadGQP<T>
    $enum: DollarEnum
  }

  return {
    ...schema,
    endpoint,
  }
}
