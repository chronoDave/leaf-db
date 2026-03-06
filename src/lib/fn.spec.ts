import test from 'node:test';
import assert from 'node:assert/strict';

import * as fn from './fn.ts';

test('[fn.equals]', async t => {
  await t.test('primitives', () => {
    assert.ok(fn.equals(1)(1), 'number');
    assert.ok(!fn.equals(1)(2), 'number mismatch');

    assert.ok(fn.equals('a')('a'), 'string');
    assert.ok(!fn.equals('a')('b'), 'string mismatch');

    assert.ok(fn.equals(true)(true), 'boolean');
    assert.ok(!fn.equals(true)(false), 'boolean mismatch');

    assert.ok(fn.equals(null)(null), 'null');
  });

  await t.test('array (shallow)', () => {
    assert.ok(fn.equals([])([]), 'empty');
    assert.ok(fn.equals([1, 2])([1, 2]), 'same order');

    assert.ok(!fn.equals([1])([1, 2]), 'length mismatch');
    assert.ok(!fn.equals([2, 1])([1, 2]), 'order mismatch');
    assert.ok(!fn.equals([1, 3])([1, 2]), 'content mismatch');
  });

  await t.test('object (shallow)', () => {
    assert.ok(fn.equals({})({}), 'empty');
    assert.ok(fn.equals({ a: 1, b: 2 })({ a: 1, b: 2 }), 'same order');
    assert.ok(fn.equals({ a: 1, b: 2 })({ b: 2, a: 1 }), 'different order');

    assert.ok(!fn.equals({})({ c: undefined }), 'undefined mismatch');
    assert.ok(!fn.equals({ a: 1, b: 2 })({ b: 2, a: 1, c: null }), 'attribute length mismatch');
    assert.ok(!fn.equals({ a: 1, b: 2 })({ b: 3, a: 2 }), 'attribute content mismatch');
  });

  await t.test('recursion', () => {
    assert.ok(fn.equals({ a: 1, b: { c: 2 } })({ b: { c: 2 }, a: 1 }), 'deep equal');
    assert.ok(!fn.equals({ a: { b: true } })({ a: { b: true, c: false } }), 'not deep equal');
  });
});
