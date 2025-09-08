import test from 'node:test';
import assert from 'node:assert/strict';

import * as struct from './is.struct.ts';

import * as is from './is.ts';

test('[is.doc] should validate doc', () => {
  assert.ok(is.doc({ _id: '3' }));

  assert.ok(!is.doc({ _id: undefined }), '_id undefined');
  assert.ok(!is.doc({ _id: { a: undefined } }), '_id object');
  assert.ok(!is.doc({ _id: [{ a: undefined }] }), '_id array');
});

test('[is.draft] should validate draft', () => {
  assert.ok(is.draft(struct.production));
  assert.ok(is.draft({}));
  assert.ok(is.draft({ a: null }));
  assert.ok(is.draft({ a: [null] }));
  assert.ok(is.draft({ date: '2010.09.31' }));
  assert.ok(is.draft({ date: {} }));
  assert.ok(is.draft({ a: '反復回転時計' }));
  assert.ok(is.draft({ a: 'a\\null\\undefined' }));
  assert.ok(is.draft({ _id: '1', a: { b: [{ c: [undefined] }] } }));
  assert.ok(is.draft({ 'test.field': 2 }));
  assert.ok(is.draft({ a: { 'test.field': 2 } }));
  assert.ok(is.draft({ a: [{ 'test.field': 2 }] }));

  assert.ok(!is.draft({ $field: 2 }), 'operator');
  assert.ok(!is.draft({ a: { $field: 2 } }), 'nested operator');
  assert.ok(!is.draft({ a: [{ $field: 2 }] }), 'array nested operator');
});

test('[is.queryMatch] should validate query', t => {
  t.test('empty', () => {
    assert.ok(is.queryMatch(struct.simple, {}));
    assert.ok(is.queryMatch(struct.nested, {}));
    assert.ok(is.queryMatch(struct.complex, {}));
  });

  t.test('match', () => {
    // Test all data types
    assert.ok(is.queryMatch(struct.simple, { _id: '1' }));
    assert.ok(is.queryMatch(struct.simple, { b: 'string' }));
    assert.ok(is.queryMatch(struct.simple, { c: null }));
    assert.ok(is.queryMatch(struct.simple, { d: false }));
    // Test nesting
    assert.ok(is.queryMatch(struct.nested, { b: { c: 'string' } }));
    assert.ok(is.queryMatch(struct.nested, { d: { f: { g: true, h: { i: null } }, j: 2 } }));
    // Test multi match
    assert.ok(is.queryMatch(struct.simple, { _id: '1', c: null }));
    assert.ok(is.queryMatch(struct.nested, { _id: '1', b: { c: 'string' } }));

    // Test all data types
    assert.ok(!is.queryMatch(struct.simple, { b: '' }));
    // Test nesting
    assert.ok(!is.queryMatch(struct.complex, { b: [null, 2, 3] }));
    assert.ok(!is.queryMatch(struct.complex, { b: [2, null] }));
    // Test multi match
    assert.ok(!is.queryMatch(struct.simple, { _id: '2', c: null }));
    assert.ok(!is.queryMatch(struct.nested, { _id: '2', b: { c: 'string' } }));
  });

  t.test('$gt', () => {
    assert.ok(is.queryMatch(struct.simple, { a: { $gt: 0 } }));
    assert.ok(is.queryMatch(struct.nested, { d: { j: { $gt: 1 } } }));

    assert.ok(!is.queryMatch(struct.simple, { a: { $gt: 1 } }));
    assert.ok(!is.queryMatch(struct.nested, { d: { j: { $gt: 2 } } }));
  });

  t.test('$gte', () => {
    assert.ok(is.queryMatch(struct.simple, { a: { $gte: 1 } }));
    assert.ok(is.queryMatch(struct.nested, { d: { j: { $gte: 2 } } }));

    assert.ok(!is.queryMatch(struct.simple, { a: { $gte: 2 } }));
    assert.ok(!is.queryMatch(struct.nested, { d: { j: { $gte: 3 } } }));
  });

  t.test('$lt', () => {
    assert.ok(is.queryMatch(struct.simple, { a: { $lt: 2 } }));
    assert.ok(is.queryMatch(struct.nested, { d: { j: { $lt: 3 } } }));

    assert.ok(!is.queryMatch(struct.simple, { a: { $lt: 1 } }));
    assert.ok(!is.queryMatch(struct.nested, { d: { j: { $lt: 2 } } }));
  });

  t.test('$lte', () => {
    assert.ok(is.queryMatch(struct.simple, { a: { $lte: 1 } }));
    assert.ok(is.queryMatch(struct.nested, { d: { j: { $lte: 2 } } }));

    assert.ok(!is.queryMatch(struct.simple, { a: { $lte: 0 } }));
    assert.ok(!is.queryMatch(struct.nested, { d: { j: { $lte: 1 } } }));
  });

  t.test('$not', () => {
    assert.ok(is.queryMatch(struct.simple, { a: { $not: 0 } }));
    assert.ok(is.queryMatch(struct.nested, { b: { c: { $not: 'e' } } }));

    assert.ok(!is.queryMatch(struct.simple, { a: { $not: 1 } }));
    assert.ok(!is.queryMatch(struct.nested, { b: { c: { $not: 'string' } } }));
  });

  t.test('$has', () => {
    assert.ok(is.queryMatch(struct.complex, { b: { $has: 2 } }));
    assert.ok(is.queryMatch(struct.complex, { b: { $has: null } }));
    assert.ok(is.queryMatch(struct.complex, { c: { $has: { d: 'String', e: { f: null }, g: true, h: 'string', i: { j: [4, null] } } } }));

    assert.ok(!is.queryMatch(struct.complex, { b: { $has: 4 } }));
    assert.ok(!is.queryMatch(struct.complex, { b: { $has: [] } }));
    assert.ok(!is.queryMatch(struct.complex, { c: { $has: { d: 'string' } } }));
  });

  t.test('$text', () => {
    assert.ok(is.queryMatch(struct.simple, { b: { $text: 'str' } }));
    assert.ok(is.queryMatch(struct.simple, { b: { $text: 'Ing' } }));
    assert.ok(is.queryMatch(struct.simple, { b: { $text: 'STRING' } }));

    assert.ok(!is.queryMatch(struct.simple, { b: { $text: 'sstring' } }));
    assert.ok(!is.queryMatch(struct.simple, { b: { $text: 'stringg' } }));
  });

  t.test('$regex', () => {
    assert.ok(is.queryMatch(struct.simple, { b: { $regex: /str/ } }));

    assert.ok(!is.queryMatch(struct.simple, { b: { $regex: /STRING/ } }));
  });
});
