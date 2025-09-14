import test from 'node:test';
import assert from 'node:assert/strict';

import parse, { isObject, hasModifier } from './parse.ts';

test('[parse.isObject]', () => {
  assert.ok(isObject({}), 'object');

  assert.ok(!isObject([]), 'not array');
  assert.ok(!isObject(null), 'not null');
  assert.ok(!isObject(undefined), 'not undefined');
});

test('[parse.hasModifier]', () => {
  assert.ok(hasModifier({ $a: 1 }), 'flat (key)');
  assert.ok(hasModifier({ a: { b: { $c: 1 } } }), 'nested (key)');

  assert.ok(!hasModifier({ a: 1 }), 'flat mismatch (key)');
  assert.ok(!hasModifier({ a: { b: { c: 1 } } }), 'nested mismatch (key)');
});

test('[parse]', () => {
  assert.throws(() => parse('a'), 'not valid json');
  assert.throws(() => parse('[]'), 'not object');
  assert.throws(() => parse('{}'), 'missing _id');
  assert.throws(() => parse('{ "_id": "a", "$has": [] }'), 'has modifier');

  assert.doesNotThrow(() => parse('{ "_id": "a" }'), 'parses');
});
