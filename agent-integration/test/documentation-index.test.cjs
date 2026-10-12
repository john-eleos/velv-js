'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const root = path.join(__dirname, '..')
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'))

test('capability manifest inventories all 91 source-routed merchant endpoints', () => {
  const manifest = readJson('capabilities/velvpay-api-capabilities-v0.2.0.json')
  const routes = manifest.groups.flatMap(group => group.routes.map(route => ({ ...route, group })))
  const keys = routes.map(({ method, path: routePath }) => `${method} ${routePath}`)

  assert.equal(manifest.authoritativeSource.commit, 'b81302575918fcd91fcdb48627dd4506c6dea161')
  assert.equal(manifest.authoritativeSource.deploymentVerified, false)
  assert.equal(manifest.authoritativeSource.remoteHeadVerifiedOn, '2026-10-09')
  assert.equal(Object.hasOwn(manifest.authoritativeSource, 'remoteHeadVerifiedAt'), false)
  assert.equal(manifest.publicDocumentation.technicalReferenceObserved, false)
  assert.equal(manifest.groups.length, 12)
  assert.equal(routes.length, 91)
  assert.equal(new Set(keys).size, 91)
  const valid = new Set(Object.keys(manifest.classificationDefinitions))
  for (const route of routes) {
    const effective = route.classification || route.group.defaultClassification
    assert.ok(valid.has(effective), `${route.method} ${route.path} has no valid effective classification`)
  }
  assert.equal(routes.filter(route => route.classification === 'restricted_session').length, 2)
  assert.equal(routes.filter(route => route.classification === 'explicitly_unsupported').length, 1)
})

test('every contract-verified capability exists in its declared OpenAPI file', () => {
  const manifest = readJson('capabilities/velvpay-api-capabilities-v0.2.0.json')
  const verified = manifest.groups.flatMap(group => group.routes)
    .filter(route => route.classification === 'contract_verified')

  assert.ok(verified.length > 2, 'v0.2 expands beyond the original collection pair')
  for (const route of verified) {
    assert.ok(route.openapi, `${route.method} ${route.path} has no OpenAPI pointer`)
    const contract = JSON.parse(fs.readFileSync(path.resolve(root, 'capabilities', route.openapi), 'utf8'))
    const openApiPath = route.path.replace(/:([A-Za-z0-9_]+)/g, '{$1}')
    assert.ok(contract.paths[openApiPath]?.[route.method.toLowerCase()], `${route.method} ${openApiPath} missing from ${route.openapi}`)
  }
})

test('v0.2 OpenAPI is GET-only and declares both authentication families', () => {
  const contract = readJson('openapi/velvpay-agent-read-api-v0.2.0.json')
  const operations = Object.values(contract.paths).flatMap(item => Object.entries(item))

  assert.equal(contract.openapi, '3.1.0')
  assert.equal(contract.info.version, '0.2.0-draft')
  assert.ok(contract.paths['/api/v1/service/storefront'].get)
  assert.ok(contract.paths['/api/v2/headless/catalog'].get)
  assert.equal(contract.paths['/api/v1/service/storefront/locations'], undefined)
  assert.ok(operations.every(([method]) => method === 'get'))
  assert.equal(contract.components.securitySchemes.ApiKeyCiphertext.name, 'api-key')
  assert.equal(contract.components.securitySchemes.HeadlessBearer.scheme, 'bearer')
  assert.equal(contract.paths['/api/v2/headless/catalog'].get['x-required-scope'], 'catalog:read')
  assert.equal(contract.paths['/api/v2/headless/customers'].get['x-data-classification'], 'customer-personal-data')
})

test('v1 and v2 error contracts match their distinct middleware envelopes', () => {
  const contract = readJson('openapi/velvpay-agent-read-api-v0.2.0.json')
  const operations = Object.entries(contract.paths).map(([routePath, item]) => ({ routePath, operation: item.get }))

  for (const { routePath, operation } of operations.filter(item => item.routePath.startsWith('/api/v1/'))) {
    for (const status of ['400', '403', '422', '503']) {
      assert.equal(operation.responses[status].$ref, '#/components/responses/LegacyV1AuthError', `${routePath} ${status}`)
    }
    assert.equal(operation.responses['429'].$ref, '#/components/responses/GlobalRateLimitError', `${routePath} 429`)
    assert.equal(operation.responses['500'].$ref, '#/components/responses/HandlerOrGlobalError', `${routePath} 500`)
    assert.equal(operation.responses['502'].$ref, '#/components/responses/GlobalTransportError', `${routePath} 502`)
  }

  for (const { routePath, operation } of operations.filter(item => item.routePath.startsWith('/api/v2/'))) {
    for (const status of ['401', '403']) {
      assert.equal(operation.responses[status].$ref, '#/components/responses/AuthError', `${routePath} ${status}`)
    }
    assert.equal(operation.responses['429'].$ref, '#/components/responses/HeadlessRateLimitError', `${routePath} 429`)
    assert.equal(operation.responses['500'].$ref, '#/components/responses/HandlerOrGlobalError', `${routePath} 500`)
    assert.equal(operation.responses['502'].$ref, '#/components/responses/GlobalTransportError', `${routePath} 502`)
    assert.equal(operation.responses['503'].$ref, '#/components/responses/AuthError', `${routePath} 503`)
  }
  assert.equal(contract.components.responses.LegacyV1OrGlobalUnavailable, undefined)
  assert.equal(contract.components.responses.HeadlessOrGlobalUnavailable, undefined)
  assert.deepEqual(contract.components.schemas.LegacyV1ErrorEnvelope.required, ['status', 'err'])
})

test('headless 429 oneOf accepts both credential and global limiter fixtures', () => {
  const contract = readJson('openapi/velvpay-agent-read-api-v0.2.0.json')
  const oneOf = contract.components.responses.HeadlessRateLimitError.content['application/json'].schema.oneOf
  assert.deepEqual(oneOf.map(branch => branch.$ref), [
    '#/components/schemas/ErrorEnvelope',
    '#/components/schemas/GlobalJsonErrorEnvelope'
  ])

  const matches = (schemaName, value) => {
    const schema = contract.components.schemas[schemaName]
    if (schema.required?.some(key => !Object.hasOwn(value, key))) return false
    if (schema.properties?.status?.const && value.status !== schema.properties.status.const) return false
    if (schemaName === 'ErrorEnvelope') {
      return typeof value.error === 'object' && value.error !== null &&
        typeof value.error.code === 'string' && typeof value.error.message === 'string'
    }
    return typeof value.error === 'string'
  }
  const credentialFixture = {
    status: 'error',
    error: { code: 'HEADLESS_RATE_LIMITED', message: 'API rate limit exceeded; retry after the current minute' }
  }
  const globalFixture = { error: 'Too many requests, slow down.' }

  assert.equal(matches('ErrorEnvelope', credentialFixture), true)
  assert.equal(matches('GlobalJsonErrorEnvelope', credentialFixture), false)
  assert.equal(matches('GlobalJsonErrorEnvelope', globalFixture), true)
  assert.equal(matches('ErrorEnvelope', globalFixture), false)
})

test('every full-record response declares classification and an allowlist policy', () => {
  const contract = readJson('openapi/velvpay-agent-read-api-v0.2.0.json')
  const fullRecordRefs = new Set([
    '#/components/responses/SingleRecord',
    '#/components/responses/RecordArray',
    '#/components/responses/PaginatedRecords'
  ])

  for (const [routePath, pathItem] of Object.entries(contract.paths)) {
    const operation = pathItem.get
    if (!fullRecordRefs.has(operation.responses['200'].$ref)) continue
    assert.ok(operation['x-data-classification'], `${routePath} lacks x-data-classification`)
    assert.equal(operation['x-downstream-field-policy'], 'explicit-allowlist-required', `${routePath} lacks allowlist policy`)
  }
})

test('documentation feeds contain only the evidence-backed public draft revision', () => {
  const feed = readJson('feeds/releases.json')
  const atom = fs.readFileSync(path.join(root, 'feeds/releases.atom'), 'utf8')

  assert.equal(feed.version, 'https://jsonfeed.org/version/1.1')
  assert.deepEqual(feed.items.map(item => item.id), ['urn:velvpay:agent-docs:0.1.0'])
  assert.equal(feed.items[0]._documentation_commit, 'e20d1cf0ef1efbcc07db8b542389b7800cb8c926')
  assert.equal(feed.items[0]._status, 'public-draft-pr')
  assert.equal(feed.items[0].date_published, '2026-10-09T19:55:08Z')
  assert.equal(feed.items[0].date_modified, '2026-10-09T19:55:27Z')
  assert.match(feed.description, /not API availability/)
  assert.equal((atom.match(/<entry>/g) || []).length, 1)
  assert.doesNotMatch(atom, /0\.2\.0-draft/)
  assert.match(atom, /2026-10-09T19:55:08Z/)
})

test('catalog curl example cannot contact a live host without explicit inputs', () => {
  const script = fs.readFileSync(path.join(root, 'examples/catalog.curl.sh'), 'utf8')
  const result = spawnSync('sh', ['examples/catalog.curl.sh'], {
    cwd: root,
    env: { PATH: process.env.PATH },
    encoding: 'utf8'
  })

  assert.equal(script.includes('BASE_URL:-https://api.velvpay.com'), false)
  assert.equal(script.includes('HEADLESS_BEARER:-'), false)
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /BASE_URL/)
})

test('llms index links capability, OpenAPI and static subscription artifacts', () => {
  const index = fs.readFileSync(path.join(root, 'llms.txt'), 'utf8')
  for (const required of [
    './API_INVENTORY.md',
    './capabilities/velvpay-api-capabilities-v0.2.0.json',
    './openapi/velvpay-agent-read-api-v0.2.0.json',
    './SUBSCRIBE.md',
    './feeds/releases.json',
    './feeds/releases.atom'
  ]) assert.match(index, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
})
