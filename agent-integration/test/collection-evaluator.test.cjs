'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const CryptoJS = require('crypto-js')

const {
  ngnToKobo,
  buildV1AuthHeaders,
  createTemporaryAccount,
  getTransactionDetails,
  classifyTransactionStatus,
  verifyStaticWebhookBearer,
  acceptFinalNotification
} = require('../mock/collection-evaluator.cjs')

const credentials = {
  publicKey: 'PK_TEST_SYNTHETIC',
  secretKey: 'SK_TEST_SYNTHETIC',
  encryptionKey: 'EK_TEST_SYNTHETIC'
}

function response(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload
  }
}

test('converts decimal NGN to integer kobo exactly', () => {
  assert.equal(ngnToKobo('1250.50'), 125050)
  assert.equal(ngnToKobo('1'), 100)
  assert.throws(() => ngnToKobo('0.50'), /at least 100 kobo/)
  assert.throws(() => ngnToKobo('10.001'), /at most two decimal places/)
})

test('v1 api-key decrypts to secret + public + reference', () => {
  const referenceId = 'ORDER-SYNTHETIC-1001'
  const headers = buildV1AuthHeaders({ ...credentials, referenceId })
  const plaintext = CryptoJS.AES.decrypt(headers['api-key'], credentials.encryptionKey)
    .toString(CryptoJS.enc.Utf8)

  assert.equal(plaintext, `${credentials.secretKey}${credentials.publicKey}${referenceId}`)
  assert.equal(headers['public-key'], credentials.publicKey)
  assert.equal(headers['reference-id'], referenceId)
  assert.equal(headers.authorization, undefined)
})

test('initialises a collection using kobo and maps a synthetic response', async () => {
  let request
  const fetchImpl = async (url, options) => {
    request = { url, options }
    return response({
      status: 'success',
      msg: 'Payment instantiated successfully (Mocked)',
      data: {
        accountNumber: '0000000000',
        accountName: 'Test Mock Account',
        amount: 125000,
        amountInNaira: 1250,
        transactionId: 'TEST-SYNTHETIC-1001',
        bank: 'Test Virtual Bank',
        validityTime: 20,
        isTest: true
      }
    })
  }

  const result = await createTemporaryAccount({
    amountNgn: '1250.00',
    merchantReference: 'ORDER-SYNTHETIC-1001',
    customerEmail: 'buyer@example.test',
    credentials,
    baseUrl: 'https://api.example.test/',
    fetchImpl
  })

  assert.equal(request.url, 'https://api.example.test/api/v1/service/payment/collection/transaction')
  assert.equal(request.options.method, 'POST')
  assert.deepEqual(JSON.parse(request.options.body), {
    amount: 125000,
    isNaira: false,
    validityTime: 20,
    email: 'buyer@example.test'
  })
  assert.equal(result.velvpayTransactionId, 'TEST-SYNTHETIC-1001')
  assert.equal(result.isSandboxMock, true)
  assert.equal(result.state, 'pending')
})

test('surfaces an initialisation failure without treating it as a payment', async () => {
  const fetchImpl = async () => response({
    status: 'error',
    msg: 'Payment with Bank Transfer is currently unavailable (Mocked)',
    data: {}
  }, 400)

  await assert.rejects(
    createTemporaryAccount({
      amountNgn: '200.00',
      merchantReference: 'ORDER-SYNTHETIC-FAILURE',
      credentials,
      baseUrl: 'https://api.example.test',
      fetchImpl
    }),
    error => {
      assert.equal(error.status, 400)
      assert.equal(error.response.status, 'error')
      assert.match(error.message, /currently unavailable/)
      return true
    }
  )
})

test('looks up details with a separate auth reference and no webhook query', async () => {
  let request
  const fetchImpl = async (url, options) => {
    request = { url, options }
    return response({ status: 'success', msg: 'Transaction Found', data: { txId: 'TEST-SYNTHETIC-1001', status: 'confirmed' } })
  }

  const payload = await getTransactionDetails({
    lookup: 'ORDER-SYNTHETIC-1001',
    requestReference: 'LOOKUP-SYNTHETIC-2001',
    credentials,
    baseUrl: 'https://api.example.test',
    fetchImpl
  })

  const url = new URL(request.url)
  assert.equal(url.pathname, '/api/v1/service/payment/collection/transaction/details')
  assert.equal(url.searchParams.get('transaction_id'), 'ORDER-SYNTHETIC-1001')
  assert.equal(url.searchParams.has('send_webhook'), false)
  assert.equal(request.options.headers['reference-id'], 'LOOKUP-SYNTHETIC-2001')
  assert.equal(payload.data.status, 'confirmed')
})

test('classifies pending and observed final states conservatively', () => {
  assert.deepEqual(classifyTransactionStatus('pending'), {
    status: 'pending', final: false, paid: false, failed: false
  })
  assert.deepEqual(classifyTransactionStatus('confirmed'), {
    status: 'confirmed', final: true, paid: true, failed: false
  })
  assert.deepEqual(classifyTransactionStatus('failed'), {
    status: 'failed', final: true, paid: false, failed: true
  })
  assert.equal(classifyTransactionStatus('provider-new-state').final, false)
})

test('validates a static webhook bearer token without loose comparison', () => {
  assert.equal(verifyStaticWebhookBearer('Bearer synthetic-webhook-secret', 'synthetic-webhook-secret'), true)
  assert.equal(verifyStaticWebhookBearer('Bearer wrong', 'synthetic-webhook-secret'), false)
  assert.equal(verifyStaticWebhookBearer('', 'synthetic-webhook-secret'), false)
})

test('applies a final notification once and absorbs an exact duplicate', async () => {
  const processedEvents = new Map()
  const transitions = []
  const args = {
    authorization: 'Bearer synthetic-webhook-secret',
    expectedToken: 'synthetic-webhook-secret',
    envelope: {
      status: 'success',
      message: 'successful',
      data: {
        txId: 'FR-SYNTHETIC-1001',
        referenceId: 'ORDER-SYNTHETIC-1001',
        status: 'confirmed',
        amount: 125000
      }
    },
    expected: {
      txId: 'FR-SYNTHETIC-1001',
      referenceId: 'ORDER-SYNTHETIC-1001',
      amountKobo: 125000
    },
    processedEvents,
    applyTransition: async event => transitions.push(event)
  }

  const first = await acceptFinalNotification(args)
  const duplicate = await acceptFinalNotification(args)
  const paidAlias = await acceptFinalNotification({
    ...args,
    envelope: { ...args.envelope, data: { ...args.envelope.data, status: 'successful' } }
  })
  const conflictingFailure = await acceptFinalNotification({
    ...args,
    envelope: { ...args.envelope, data: { ...args.envelope.data, status: 'failed' } }
  })

  assert.equal(first.applied, true)
  assert.equal(first.duplicate, false)
  assert.equal(first.conflict, false)
  assert.equal(duplicate.applied, false)
  assert.equal(duplicate.duplicate, true)
  assert.equal(duplicate.conflict, false)
  assert.equal(paidAlias.applied, false)
  assert.equal(paidAlias.duplicate, true)
  assert.equal(paidAlias.conflict, false)
  assert.equal(conflictingFailure.applied, false)
  assert.equal(conflictingFailure.duplicate, false)
  assert.equal(conflictingFailure.conflict, true)
  assert.equal(transitions.length, 1)
  assert.equal(processedEvents.size, 1)
})

test('OpenAPI contract is valid JSON and pins the bounded paths and headers', () => {
  const contractPath = path.join(__dirname, '..', 'openapi', 'velvpay-ngn-collection-v0.1.0.json')
  const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'))
  assert.equal(contract.openapi, '3.1.0')
  assert.equal(contract.info.version, '0.1.0')
  assert.ok(contract.paths['/api/v1/service/payment/collection/transaction'].post)
  assert.ok(contract.paths['/api/v1/service/payment/collection/transaction'].post.responses['404'])
  const lookup = contract.paths['/api/v1/service/payment/collection/transaction/details'].get
  assert.deepEqual(lookup.parameters.map(parameter => parameter.name), ['transaction_id'])
  assert.equal(contract.components.securitySchemes.ApiKeyCiphertext.name, 'api-key')
  assert.equal(contract.components.securitySchemes.PublicKey.name, 'public-key')
  assert.equal(contract.components.securitySchemes.RequestReference.name, 'reference-id')
  const serializedContract = JSON.stringify(contract)
  assert.match(contract.info.description, /Historical source reference and offline evaluation/)
  assert.match(serializedContract, /activity logs and analytics/)
  assert.doesNotMatch(serializedContract, /read-only/i)
  const request = contract.components.schemas.CreateCollectionRequest
  assert.equal(request.properties.amount.minimum, 100)
  assert.equal(request.properties.isNaira.const, false)
  assert.equal(Object.hasOwn(request.properties, 'currency'), false)
})
