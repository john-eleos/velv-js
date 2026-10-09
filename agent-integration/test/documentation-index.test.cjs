'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'))

test('capability manifest inventories all 91 source-routed merchant endpoints', () => {
  const manifest = readJson('capabilities/velvpay-api-capabilities-v0.2.0.json')
  const routes = manifest.groups.flatMap(group => group.routes.map(route => ({ ...route, group })))
  const keys = routes.map(({ method, path: routePath }) => `${method} ${routePath}`)

  assert.equal(manifest.authoritativeSource.commit, 'b81302575918fcd91fcdb48627dd4506c6dea161')
  assert.equal(manifest.authoritativeSource.deploymentVerified, false)
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

test('documentation feeds contain only the two real documentation revisions', () => {
  const feed = readJson('feeds/releases.json')
  const atom = fs.readFileSync(path.join(root, 'feeds/releases.atom'), 'utf8')

  assert.equal(feed.version, 'https://jsonfeed.org/version/1.1')
  assert.deepEqual(feed.items.map(item => item.id), [
    'urn:velvpay:agent-docs:0.2.0-draft',
    'urn:velvpay:agent-docs:0.1.0'
  ])
  assert.equal(feed.items[1]._documentation_commit, 'e20d1cf0ef1efbcc07db8b542389b7800cb8c926')
  assert.match(feed.description, /not API availability/)
  assert.equal((atom.match(/<entry>/g) || []).length, 2)
  assert.match(atom, /urn:velvpay:agent-docs:0\.2\.0-draft/)
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
