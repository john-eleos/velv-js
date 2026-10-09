import CryptoJS from 'crypto-js'

// Offline example source-verified against the velv-backend production branch at
// b81302575918fcd91fcdb48627dd4506c6dea161 on 2026-10-09 UTC. It is not live
// deployment or connected-sandbox proof.

type Credentials = {
  publicKey: string
  secretKey: string
  encryptionKey: string
}

type InitialisedCollection = {
  accountNumber?: string
  accountName?: string
  amount: number
  amountInNaira: number
  transactionId: string
  bank: string
  validityTime: number
  isTest?: boolean
  [key: string]: unknown
}

type Transaction = {
  txId: string
  referenceId?: string | null
  amount?: number
  amountInNaira?: number
  status: string
  [key: string]: unknown
}

type Envelope<T> = {
  status: string
  msg: string
  data: T
}

const DEFAULT_BASE_URL = 'https://api.velvpay.com'

function requireValue(name: string, value: string): string {
  const trimmed = value?.trim()
  if (!trimmed) throw new TypeError(`${name} must be a non-empty string`)
  return trimmed
}

function buildV1Headers(credentials: Credentials, referenceId: string) {
  const secretKey = requireValue('secretKey', credentials.secretKey)
  const publicKey = requireValue('publicKey', credentials.publicKey)
  const encryptionKey = requireValue('encryptionKey', credentials.encryptionKey)
  const reference = requireValue('referenceId', referenceId)

  return {
    'content-type': 'application/json',
    'api-key': CryptoJS.AES.encrypt(
      `${secretKey}${publicKey}${reference}`,
      encryptionKey
    ).toString(),
    'public-key': publicKey,
    'reference-id': reference
  }
}

async function responseJson<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({})) as Record<string, unknown>
  if (!response.ok) {
    const detail = body.err ?? body.reason ?? body.msg ?? `HTTP ${response.status}`
    throw new Error(`VelvPay request failed (${response.status}): ${String(detail)}`)
  }
  return body as T
}

export async function createNgnCollection({
  amountKobo,
  merchantReference,
  customerEmail,
  validityTime = 20,
  credentials,
  baseUrl = DEFAULT_BASE_URL
}: {
  amountKobo: number
  merchantReference: string
  customerEmail?: string
  validityTime?: number
  credentials: Credentials
  baseUrl?: string
}): Promise<Envelope<InitialisedCollection>> {
  if (!Number.isSafeInteger(amountKobo) || amountKobo < 100) {
    throw new RangeError('amountKobo must be a safe integer of at least 100')
  }
  if (!Number.isInteger(validityTime) || validityTime < 20 || validityTime > 60) {
    throw new RangeError('validityTime must be an integer from 20 to 60')
  }

  const body: Record<string, unknown> = {
    amount: amountKobo,
    isNaira: false,
    validityTime
  }
  if (customerEmail) body.email = requireValue('customerEmail', customerEmail)

  const response = await fetch(
    `${baseUrl.replace(/\/+$/, '')}/api/v1/service/payment/collection/transaction`,
    {
      method: 'POST',
      headers: buildV1Headers(credentials, merchantReference),
      body: JSON.stringify(body)
    }
  )
  return responseJson<Envelope<InitialisedCollection>>(response)
}

export async function getNgnCollectionStatus({
  transactionIdOrMerchantReference,
  requestReference,
  credentials,
  baseUrl = DEFAULT_BASE_URL
}: {
  transactionIdOrMerchantReference: string
  requestReference: string
  credentials: Credentials
  baseUrl?: string
}): Promise<Envelope<Transaction>> {
  const url = new URL(
    `${baseUrl.replace(/\/+$/, '')}/api/v1/service/payment/collection/transaction/details`
  )
  url.searchParams.set(
    'transaction_id',
    requireValue('transactionIdOrMerchantReference', transactionIdOrMerchantReference)
  )

  // Deliberately do not add send_webhook. In the audited backend, even the
  // query-string text "false" can trigger a notification enqueue. This avoids
  // webhook delivery, but the backend still records activity and analytics.
  const response = await fetch(url, {
    method: 'GET',
    headers: buildV1Headers(credentials, requestReference)
  })
  return responseJson<Envelope<Transaction>>(response)
}
