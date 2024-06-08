import type { $enum } from '@teages/gqf'
import { useSchema as _useSchema } from '@teages/gqf'
import type { DollarEnum, Endpoints, ExactEndpoints, LoadGQF, LoadGQP } from '../internal/utils/schema'

export interface UseSchema<
  TEndpoint extends Endpoints,
> {
  endpoint?: TEndpoint
  gqf: LoadGQF<TEndpoint>
  gqp: LoadGQP<TEndpoint>
  $enum: typeof $enum
}

export interface UseSchemaWithWarning {
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

export function useSchema(): UseSchema<string>
export function useSchema<T extends ExactEndpoints>(endpoint: T): UseSchema<T>
export function useSchema(endpoint: string): UseSchemaWithWarning
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
