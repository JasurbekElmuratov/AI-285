// Contract/example consistency checks; not a full OpenAPI validator or backend test.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (name) => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'));
const api = read('openapi.json');
const fixtures = read('examples/fixtures.json');
const requests = read('examples/requests.json');
const response = read('examples/local-demo-search-response.json');

function resolve(ref) {
  assert.ok(ref.startsWith('#/'), `Only local references supported: ${ref}`);
  return ref.slice(2).split('/').reduce((node, key) => {
    assert.ok(node && Object.hasOwn(node, key), `Unresolved reference: ${ref}`);
    return node[key];
  }, api);
}
function walk(node) {
  if (!node || typeof node !== 'object') return;
  if (node.$ref) resolve(node.$ref);
  Object.values(node).forEach(walk);
}
walk(api);
assert.equal(api.openapi, '3.1.1');
const operationIds = new Set();
for (const [route, methods] of Object.entries(api.paths)) {
  for (const [method, op] of Object.entries(methods)) {
    assert.ok(!operationIds.has(op.operationId), 'Duplicate operationId');
    operationIds.add(op.operationId);
    assert.ok(Object.keys(op.responses).some(x => x.startsWith('2')));
    if (route.includes('{id}')) assert.ok(op.parameters.some(x => x.name === 'id' && x.in === 'path' && x.required));
    if (method !== 'get' || ['/me/services', '/review-queue', '/services/{id}/reviews'].includes(route)) {
      assert.deepEqual(op.security, [{ bearerAuth: [] }]);
    }
  }
}

// Validate the small JSON Schema keyword subset actually used by these components.
// An external OpenAPI validator is still recommended before generating server/client code.
function check(value, schema, label = 'value') {
  if (schema.$ref) return check(value, resolve(schema.$ref), label);
  const types = Array.isArray(schema.type) ? schema.type : [schema.type];
  const type = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
  assert.ok(types.includes(type) || (types.includes('integer') && Number.isInteger(value)), `${label}: wrong type`);
  if (value === null) return;
  if (schema.enum) assert.ok(schema.enum.includes(value), `${label}: unsupported enum`);
  if (typeof value === 'string') {
    if (schema.minLength) assert.ok(value.trim().length >= schema.minLength, `${label}: empty`);
    if (schema.maxLength) assert.ok(value.length <= schema.maxLength, `${label}: too long`);
    if (schema.pattern) assert.match(value, new RegExp(schema.pattern));
    if (schema.format === 'uuid') assert.match(value, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    if (schema.format === 'date-time') assert.ok(Number.isFinite(Date.parse(value)) && value.endsWith('Z'));
    if (schema.format === 'uri') assert.equal(new URL(value).protocol, 'https:');
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined) assert.ok(value >= schema.minimum, label);
    if (schema.maximum !== undefined) assert.ok(value <= schema.maximum, label);
  }
  if (Array.isArray(value)) {
    if (schema.minItems) assert.ok(value.length >= schema.minItems, label);
    if (schema.maxItems) assert.ok(value.length <= schema.maxItems, label);
    if (schema.uniqueItems) assert.equal(new Set(value.map(x => JSON.stringify(x))).size, value.length);
    value.forEach((item, i) => check(item, schema.items, `${label}[${i}]`));
  } else if (type === 'object') {
    for (const key of schema.required ?? []) assert.ok(Object.hasOwn(value, key), `${label}.${key}: required`);
    if (schema.minProperties) assert.ok(Object.keys(value).length >= schema.minProperties);
    for (const [key, item] of Object.entries(value)) {
      if (schema.additionalProperties === false) assert.ok(Object.hasOwn(schema.properties, key), `${label}.${key}: forbidden`);
      if (schema.properties?.[key]) check(item, schema.properties[key], `${label}.${key}`);
    }
  }
}
const S = api.components.schemas;
for (const [key, schema] of Object.entries({create:'ServiceCreate',edit:'ServicePatch',submit:'VersionRequest',approve:'ReviewRequest',request_changes:'ReviewRequest',archive:'VersionRequest'})) {
  check(requests[key], S[schema], key);
}
for (const forbidden of ['status', 'approved_version', 'is_demo', 'created_by', 'organization_id']) {
  assert.throws(() => check({...requests.edit, [forbidden]: 'injected'}, S.ServicePatch));
}
assert.throws(() => check({expected_version:1}, S.ServicePatch));
check(response, S.PublicServiceList, 'local demo response');

const users = new Map(fixtures.users.map(x => [x.id,x]));
const orgs = new Map(fixtures.organizations.map(x => [x.id,x]));
const services = new Map(fixtures.services.map(x => [x.id,x]));
for (const key of ['users', 'organizations', 'services', 'reviews']) {
  assert.equal(new Set(fixtures[key].map(x => x.id)).size, fixtures[key].length, `${key}: duplicate IDs`);
}
assert.equal(new Set(fixtures.memberships.map(x => `${x.user_id}/${x.organization_id}`)).size, fixtures.memberships.length);
for (const membership of fixtures.memberships) {
  assert.ok(users.has(membership.user_id) && orgs.has(membership.organization_id));
  assert.equal(users.get(membership.granted_by).platform_role,'admin');
}
for (const service of fixtures.services) {
  const {created_by, ...managed} = service;
  check(managed, S.ManagedService, service.title);
  assert.ok(users.has(created_by) && orgs.has(service.organization_id));
  assert.ok(fixtures.memberships.some(x => x.user_id === created_by && x.organization_id === service.organization_id));
  assert.equal(service.area_slug, fixtures.pilot.area_slug);
  assert.equal(service.is_demo, true);
  assert.equal(service.latitude === null, service.longitude === null);
  for (const key of ['contact_url','source_url']) assert.ok(new URL(service[key]).hostname.endsWith('.example'));
  if (service.status === 'approved') {
    assert.equal(service.version, service.approved_version);
    assert.ok(Date.parse(service.verification_expires_at) > Date.parse(service.last_verified_at));
    assert.ok(fixtures.reviews.some(r => r.service_id === service.id && r.reviewed_version === service.version && r.decision === 'approve'));
  } else {
    for (const key of ['approved_version','last_verified_at','verification_expires_at']) assert.equal(service[key],null);
  }
}
for (const review of fixtures.reviews) {
  const service = services.get(review.service_id);
  assert.ok(service && ['reviewer','admin'].includes(users.get(review.reviewer_id)?.platform_role));
  assert.notEqual(review.reviewer_id,service.created_by);
  assert.ok(!fixtures.memberships.some(x => x.user_id === review.reviewer_id && x.organization_id === service.organization_id));
  assert.equal(review.reviewed_version,service.version);
  assert.equal(review.snapshot.organization_id,service.organization_id);
  for (const [key,value] of Object.entries(review.snapshot)) assert.deepEqual(value,service[key]);
}
const now = Date.parse(fixtures.as_of);
const visible = (s, time, localDemo) => s.status === 'approved' && s.version === s.approved_version &&
  Date.parse(s.last_verified_at) <= time && Date.parse(s.verification_expires_at) > time &&
  (localDemo || (!s.is_demo && !orgs.get(s.organization_id).is_demo));
for (const localDemo of [true,false]) {
  assert.deepEqual(fixtures.services.filter(s => visible(s,now,localDemo)).map(s => s.id),
    localDemo ? fixtures.expected_public_ids_in_local_demo : fixtures.expected_public_ids_in_production);
}
assert.deepEqual(response.items.map(x => x.id),fixtures.expected_public_ids_in_local_demo);
assert.equal(response.total,response.items.length);
assert.equal(visible(fixtures.services[0],Date.parse(fixtures.services[0].verification_expires_at),true),false);
assert.equal(fixtures.services.length,5);
console.log(`Checked ${operationIds.size} API operations, local references, request/response examples, access-field exclusions and 5 fixture scenarios.`);
console.log('SQL execution, runtime authorization and complete OpenAPI conformance still require implementation-time validation.');
