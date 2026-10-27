import test from 'node:test';
import assert from 'node:assert/strict';
import { cities, filterResources, parseCategory, resolveLocation, resources, supportUrl } from '../src/resources.ts';

test('city names, aliases, and example ZIP codes resolve consistently', () => {
  assert.equal(resolveLocation('  Denver, CO  '), 'denver');
  assert.equal(resolveLocation('NYC'), 'new-york');
  assert.equal(resolveLocation('90012'), 'los-angeles');
  assert.equal(resolveLocation('33130'), 'miami');
  assert.equal(resolveLocation(''), null);
});

test('unsupported or malformed locations do not return unrelated listings', () => {
  for (const input of ['99999', '123', 'San Francisco', '<img src=x onerror=alert(1)>']) {
    assert.equal(resolveLocation(input), 'unknown');
    assert.deepEqual(filterResources('all', input), []);
  }
});

test('category and location filters combine', () => {
  assert.deepEqual(filterResources('healthcare', '80202').map(r => r.id), ['free-health-clinic']);
  assert.deepEqual(filterResources('food', 'Los Angeles').map(r => r.id), ['food-access', 'neighborhood-meal-program']);
});

test('keyword searches find support descriptions and offers case-insensitively', () => {
  assert.deepEqual(filterResources('food', 'Denver', '  MEAL  ').map(r => r.id), ['community-grocery-support']);
  assert.deepEqual(filterResources('transportation', 'Denver', 'ride').map(r => r.id), ['appointment-ride-program']);
});

test('empty searches return all examples and impossible combinations return none', () => {
  assert.equal(filterResources('all', '').length, 12);
  assert.deepEqual(filterResources('healthcare', 'Denver', 'groceries'), []);
});

test('unrecognized URL categories fall back to all', () => {
  assert.equal(parseCategory('healthcare'), 'healthcare');
  assert.equal(parseCategory('invalid'), 'all');
  assert.equal(parseCategory(null), 'all');
});

test('support links preserve filters while safely encoding punctuation', () => {
  const url = new URL(supportUrl('food', 'New York, NY', 'meals & groceries'), 'https://example.com');
  assert.equal(url.pathname, '/support');
  assert.equal(url.searchParams.get('location'), 'New York, NY');
  assert.equal(url.searchParams.get('category'), 'food');
  assert.equal(url.searchParams.get('q'), 'meals & groceries');
  assert.equal(supportUrl('all', '  ', ''), '/support');
});

test('every resource has a unique URL and a valid example-city association', () => {
  assert.equal(new Set(resources.map(r => r.id)).size, resources.length);
  assert.ok(resources.every(r => cities.some(c => c.id === r.cityId)));
  assert.equal(resources.filter(r => r.landing).length, 4);
});
