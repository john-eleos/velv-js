'use strict'

const crypto = require('node:crypto')
const CryptoJS = require('crypto-js')

const DEFAULT_BASE_URL = 'https://api.velvpay.com'
const FINAL_STATUSES = new Set(['confirmed', 'successful', 'failed'])

function requireNonEmpty(name, value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(`${name} must be a non-empty string`)
  }
  return value.trim()
}

function normaliseBaseUrl(baseUrl) {
  return requireNonEmpty('baseUrl', baseUrl).replace(/\/+$/, '')
}

function ngnToKobo(amountNgn) {
  const value = String(amountNgn).trim()
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) {
    throw new TypeError('amountNgn must be a positive decimal with at most two decimal places')
  }
  const [naira, fraction = ''] = value.split('.')
  const kobo = (BigInt(naira) * 100n) + BigInt(fraction.padEnd(2, '0'))
  if (kobo < 100n) throw new RangeError('VelvPay collection amount must be at least 100 kobo (NGN 1.00)')
  if (kobo > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError('amountNgn is too large')
  return Number(kobo)
}

function buildV1AuthHeaders({ secretKey, publicKey, encryptionKey, referenceId }) {
  const secret = requireNonEmpty('secretKey', secretKey)
  const publicValue = requireNonEmpty('publicKey', publicKey)
  const password = requireNonEmpty('encryptionKey', encryptionKey)
  const reference = requireNonEmpty('referenceId', referenceId)

  return {
    'content-type': 'application/json',
    'api-key': CryptoJS.AES.encrypt(`${secret}${publicValue}${reference}`, password).toString(),
    'public-key': publicValue,
    'reference-id': reference
  }
}

async function requestJson(url, options, fetchImpl) {
  if (typeof fetchImpl !== 'function') throw new TypeError('fetchImpl must be a function')
  const response = await fetchImpl(url, options)
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = payload?.err || payload?.reason || payload?.msg || `VelvPay request failed with HTTP ${response.status}`
    const error = new Error(message)
    error.status = response.status
    error.response = payload
    throw error
  }
  return payload
}

async function createTemporaryAccount({
  amountNgn,
  merchantReference,
  customerEmail,
  validityTime = 20,
  credentials,
  baseUrl = DEFAULT_BASE_URL,
  fetchImpl = globalThis.fetch
}) {
  const referenceId = requireNonEmpty('merchantReference', merchantReference)
  if (!Number.isInteger(validityTime) || validityTime < 20 || validityTime > 60) {
    throw new RangeError('validityTime must be an integer from 20 to 60 minutes')
  }

  const body = { amount: ngnToKobo(amountNgn), isNaira: false, validityTime }
  if (customerEmail) body.email = requireNonEmpty('customerEmail', customerEmail)

  const payload = await requestJson(
    `${normaliseBaseUrl(baseUrl)}/api/v1/service/payment/collection/transaction`,
    {
      method: 'POST',
      headers: buildV1AuthHeaders({ ...credentials, referenceId }),
      body: JSON.stringify(body)
    },
    fetchImpl
  )

  return {
    merchantReference: referenceId,
    velvpayTransactionId: payload?.data?.transactionId,
    accountNumber: payload?.data?.accountNumber,
    accountName: payload?.data?.accountName,
    bank: payload?.data?.bank,
    amountKobo: payload?.data?.amount,
    amountNgn: payload?.data?.amountInNaira,
    validityTime: payload?.data?.validityTime,
    isSandboxMock: payload?.data?.isTest === true,
    state: 'pending',
    raw: payload
  }
}

async function getTransactionDetails({
  lookup,
  requestReference,
  credentials,
  baseUrl = DEFAULT_BASE_URL,
  fetchImpl = globalThis.fetch
}) {
  const transactionLookup = requireNonEmpty('lookup', lookup)
  const referenceId = requireNonEmpty('requestReference', requestReference)
  const url = new URL(`${normaliseBaseUrl(baseUrl)}/api/v1/service/payment/collection/transaction/details`)
  url.searchParams.set('transaction_id', transactionLookup)

  return requestJson(url.toString(), {
    method: 'GET',
    headers: buildV1AuthHeaders({ ...credentials, referenceId })
  }, fetchImpl)
}

function classifyTransactionStatus(status) {
  const normalised = String(status || '').trim().toLowerCase()
  return {
    status: normalised || 'unknown',
    final: FINAL_STATUSES.has(normalised),
    paid: normalised === 'successful' || normalised === 'confirmed',
    failed: normalised === 'failed'
  }
}

function verifyStaticWebhookBearer(authorization, expectedToken) {
  const expected = requireNonEmpty('expectedToken', expectedToken)
  const match = /^Bearer\s+(.+)$/i.exec(String(authorization || ''))
  if (!match) return false
  const received = Buffer.from(match[1], 'utf8')
  const wanted = Buffer.from(expected, 'utf8')
  return received.length === wanted.length && crypto.timingSafeEqual(received, wanted)
}

async function acceptFinalNotification({
  authorization,
  expectedToken,
  envelope,
  expected,
  processedEvents,
  applyTransition
}) {
  // Offline demonstration only: callers are serialized in one process. This
  // Map is not durable, atomic, concurrency-safe or crash/restart-safe.
  if (!verifyStaticWebhookBearer(authorization, expectedToken)) {
    const error = new Error('invalid webhook authorization')
    error.status = 401
    throw error
  }
  if (!(processedEvents instanceof Map)) throw new TypeError('processedEvents must be a Map for this offline evaluator')
  if (typeof applyTransition !== 'function') throw new TypeError('applyTransition must be a function')

  const data = envelope?.data || {}
  const state = classifyTransactionStatus(data.status)
  if (!state.final) return { accepted: true, applied: false, duplicate: false, state }

  if (String(data.txId || '') !== requireNonEmpty('expected.txId', expected?.txId)) {
    throw new Error('transaction ID mismatch')
  }
  if (String(data.referenceId || '') !== requireNonEmpty('expected.referenceId', expected?.referenceId)) {
    throw new Error('merchant reference mismatch')
  }
  if (!Number.isSafeInteger(data.amount) || data.amount !== expected?.amountKobo) {
    throw new Error('amount mismatch')
  }

  const eventKey = data.txId
  const semanticState = state.paid ? 'paid' : 'failed'
  if (processedEvents.has(eventKey)) {
    const priorState = processedEvents.get(eventKey)
    return {
      accepted: true,
      applied: false,
      duplicate: priorState === semanticState,
      conflict: priorState !== semanticState,
      priorState,
      state,
      eventKey
    }
  }

  await applyTransition({ ...data, state })
  processedEvents.set(eventKey, semanticState)
  return { accepted: true, applied: true, duplicate: false, conflict: false, state, eventKey }
}

module.exports = {
  DEFAULT_BASE_URL,
  FINAL_STATUSES,
  ngnToKobo,
  buildV1AuthHeaders,
  createTemporaryAccount,
  getTransactionDetails,
  classifyTransactionStatus,
  verifyStaticWebhookBearer,
  acceptFinalNotification
}
