import type { Schemas } from '@teages/gqf/schema'

export type ExactEndpoints = keyof Schemas
export type Endpoints = string | ExactEndpoints
