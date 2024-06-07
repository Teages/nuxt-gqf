import type { Config } from '@teages/gqf/cli'
import { sync } from '@teages/gqf/cli'

export async function syncSchema(clients: Config['clients']) {
  const output = await sync({
    clients,
    silent: true,
    output: '',
  })
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
