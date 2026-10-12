export interface HeadlessPage<T extends Record<string, unknown>> {
  status: 'success'
  data: T[]
  meta: { page: number; limit: number; total: number; hasMore: boolean }
}

export class VelvPayReadError extends Error {
  constructor(
    public readonly status: number,
    public readonly response: unknown
  ) {
    super(`VelvPay read failed with HTTP ${status}`)
  }
}

export async function listHeadlessCatalog<T extends Record<string, unknown>>({
  credential,
  baseUrl = 'https://api.velvpay.com',
  page = 1,
  limit = 25,
  fetchImpl = fetch
}: {
  credential: string
  baseUrl?: string
  page?: number
  limit?: number
  fetchImpl?: typeof fetch
}): Promise<HeadlessPage<T>> {
  if (!credential.startsWith('vch_') || credential.length < 35) {
    throw new Error('Provide a server-side vch_ headless credential')
  }
  if (!Number.isInteger(page) || page < 1) throw new Error('page must be a positive integer')
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('limit must be an integer from 1 to 100')

  const url = new URL('/api/v2/headless/catalog', baseUrl)
  url.searchParams.set('page', String(page))
  url.searchParams.set('limit', String(limit))

  const response = await fetchImpl(url, {
    method: 'GET',
    headers: { authorization: `Bearer ${credential}`, accept: 'application/json' }
  })
  const payload: unknown = await response.json()
  if (!response.ok) throw new VelvPayReadError(response.status, payload)
  return payload as HeadlessPage<T>
}
