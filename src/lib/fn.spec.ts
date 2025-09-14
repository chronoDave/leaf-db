import test from 'node:test';
import assert from 'node:assert/strict';

import * as fn from './fn.ts';

test('[fn.subset]', () => {
  const obj = {
    a: 1,
    b: 'b',
    c: true,
    d: null,
    e: [2, 'f', false, null],
    g: {
      h: { i: 3 },
      j: ['k', true]
    },
    l: [{ m: 1 }, { n: 2, o: { p: null } }]
  };

  assert.ok(fn.subset(obj)({ a: 1 }), 'number');
  assert.ok(fn.subset(obj)({ b: 'b' }), 'string');
  assert.ok(fn.subset(obj)({ c: true }), 'boolean');
  assert.ok(fn.subset(obj)({ d: null }), 'null');
  assert.ok(fn.subset(obj)({ g: { h: { i: 3 } } }), 'object');
  assert.ok(fn.subset(obj)({ e: [2] }), 'array');
  assert.ok(fn.subset(obj)({ l: [{ n: 2 }] }), 'object array');
  assert.ok(fn.subset(obj)({ a: 1, g: { h: { i: 3 } }, e: [2] }), 'mixed');

  assert.ok(!fn.subset(obj)({ z: 1 }), 'key mismatch');
  assert.ok(!fn.subset(obj)({ a: '1' }), 'type mismatch');
  assert.ok(!fn.subset(obj)({ a: 2 }), 'primitive mismatch');
  assert.ok(!fn.subset(obj)({ g: { h: { i: 2 } } }), 'object mismatch');
  assert.ok(!fn.subset(obj)({ e: [3] }), 'array mismatch');
  assert.ok(!fn.subset(obj)({ a: 1, g: { h: { i: 3 } }, e: [3] }), 'mixed mismatch');
});

test('[fn.equals]', () => {
  assert.ok(fn.equals(1)(1), 'number');
  assert.ok(!fn.equals(1)(2), 'number mismatch');

  assert.ok(fn.equals('a')('a'), 'string');
  assert.ok(!fn.equals('a')('b'), 'string mismatch');

  assert.ok(fn.equals(true)(true), 'boolean');
  assert.ok(!fn.equals(true)(false), 'boolean mismatch');

  assert.ok(fn.equals(null)(null), 'null');

  assert.ok(fn.equals({})({}), 'object (empty)');
  assert.ok(fn.equals({ a: 1, b: 2 })({ a: 1, b: 2 }), 'object (same order)');
  assert.ok(fn.equals({ a: 1, b: 2 })({ b: 2, a: 1 }), 'object (different order)');
  assert.ok(fn.equals({ a: 1, b: { c: 2 } })({ b: { c: 2 }, a: 1 }), 'object (nesting)');
  
  assert.ok(!fn.equals({})({ c: undefined }), 'object mismatch (undefined)');
  assert.ok(!fn.equals({ a: 1, b: 2 })({ b: 2, a: 1, c: null }), 'object mismatch (extra attribute)');
  assert.ok(!fn.equals({ a: { b: true } })({ a: { b: true, c: false } }), 'object mismatch (nesting extra attribute)');

  assert.ok(fn.equals([])([]), 'array (empty)');
  assert.ok(fn.equals([1, 2, 3])([1, 2, 3]), 'array (same order)');

  assert.ok(!fn.equals([1, 2, 3])([1, 2]), 'array mismatch (length)');
  assert.ok(!fn.equals([1, 2, 3])([3, 2, 1]), 'array mismatch (order)');
});
