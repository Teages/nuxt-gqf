import type { Config } from '@teages/gqf/cli'
import { sync } from '@teages/gqf/cli'

interface SyncResult {
  output: Array<{
    filename: string
    url: string
    content: string
  }>
  success: string[]
  failed: string[]
}

export async function syncSchema(clients: Config['clients']): Promise<SyncResult> {
  const output = await sync({
    clients,
    silent: true,
    output: '',
  }) as Array<{
    filename: string
    url: string
    content: string
  }>

  const success = clients
    .map(client => typeof client === 'object' ? client.url : client)
    .filter(url => output.some(
      o => o.url === url,
    ))
  const failed = clients
    .map(client => typeof client === 'object' ? client.url : client)
    .filter(url => !success.includes(url))

  return {
    output,
    success,
    failed,
  }
}
