import test from 'node:test';
import assert from 'node:assert/strict';

import query from './query.ts';

test('[query] matches properties', () => {
  const doc = {
    a: 1,
    b: 'b',
    c: true,
    d: null,
    e: [2, 'f', false, null],
    g: {
      h: { i: 3 },
      j: ['k', true]
    }
  };

  assert.ok(query(doc)({ a: 1 }), 'number');
  assert.ok(query(doc)({ b: 'b' }), 'string');
  assert.ok(query(doc)({ c: true }), 'boolean');
  assert.ok(query(doc)({ d: null }), 'null');
  assert.ok(query(doc)({ e: [2, 'f', false, null] }), 'array');
  assert.ok(query(doc)({ g: {
    h: { i: 3 },
    j: ['k', true]
  } }), 'object');
  assert.ok(query(doc)({ g: { h: { i: 3 } } }), 'partial object');

  assert.ok(!query(doc)({ a: 2 }), 'number mismatch');
  assert.ok(!query(doc)({ b: 'c' }), 'string mismatch');
  assert.ok(!query(doc)({ c: false }), 'boolean mismatch');
  assert.ok(!query(doc)({ e: [2, 'f', null] }), 'array mismatch');
  assert.ok(!query(doc)({ g: {
    h: { i: 3 },
    j: ['k', false]
  } }), 'object mismatch');
});

test('[query] matches operators', () => {
  const doc = {
    a: 1,
    b: 'b',
    c: true,
    d: null,
    e: [2, 'f', false, null, [4, 5]],
    g: {
      h: { i: 3 },
      j: ['k', true]
    }
  };

  assert.ok(query(doc)({ a: { $gt: 0 } }), '$gt match');
  assert.ok(!query(doc)({ a: { $gt: 2 } }), '$gt mismatch');

  assert.ok(query(doc)({ a: { $gte: 1 } }), '$gte match');
  assert.ok(!query(doc)({ a: { $gte: 2 } }), '$gte mismatch');

  assert.ok(query(doc)({ a: { $lt: 2 } }), '$lt match');
  assert.ok(!query(doc)({ a: { $lt: 0 } }), '$lt mismatch');

  assert.ok(query(doc)({ a: { $lte: 1 } }), '$lte match');
  assert.ok(!query(doc)({ a: { $lte: 0 } }), '$lte mismatch');

  assert.ok(query(doc)({ b: { $regexp: /\w{1}/ } }), '$regexp match');
  assert.ok(!query(doc)({ b: { $regexp: /\W/ } }), '$regexp mismatch');

  assert.ok(query(doc)({ e: { $length: 5 } }), '$length match');
  assert.ok(!query(doc)({ e: { $length: 3 } }), '$length mismatch');

  assert.ok(query(doc)({ e: { $includes: 2 } }), '$includes match');
  assert.ok(!query(doc)({ e: { $includes: [4] } }), '$includes mismatch');

  assert.ok(query(doc)({ $not: { a: 2 } }), '$not match');
  assert.ok(!query(doc)({ $not: { a: 1 } }), '$not mismatch');

  assert.ok(query(doc)({ $or: [{ a: 2 }, { c: true }] }), '$or match');
  assert.ok(!query(doc)({ $or: [{ a: 2 }, { c: false }] }), '$or mismatch');

  assert.ok(query(doc)({ $and: [{ a: 1 }, { c: true }] }), '$and match');
  assert.ok(!query(doc)({ $and: [{ a: 1 }, { c: false }] }), '$and mismatch');

  assert.ok(query(doc)({ g: { h: { i: { $gt: 1 } } } }), 'partial match');
});
