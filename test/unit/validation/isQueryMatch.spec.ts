import test from 'node:test';
import assert from 'node:assert/strict';

import { isQueryMatch } from '../../../src/validation';
import { simple, nested, complex } from './fixture';

test('[isQueryMatch] should return true on empty query', () => {
  assert.ok(isQueryMatch(simple, {}));
  assert.ok(isQueryMatch(nested, {}));
  assert.ok(isQueryMatch(complex, {}));
});

test('[isQueryMatch] should return true if query matches', () => {
  // Test all data types
  assert.ok(isQueryMatch(simple, { _id: '1' }));
  assert.ok(isQueryMatch(simple, { b: 'string' }));
  assert.ok(isQueryMatch(simple, { c: null }));
  assert.ok(isQueryMatch(simple, { d: false }));
  // Test nesting
  assert.ok(isQueryMatch(nested, { b: { c: 'string' } }));
  assert.ok(isQueryMatch(nested, { d: { f: { g: true, h: { i: null } }, j: 2 } }));
  // Test multi match
  assert.ok(isQueryMatch(simple, { _id: '1', c: null }));
  assert.ok(isQueryMatch(nested, { _id: '1', b: { c: 'string' } }));
});

test('[isQueryMatch] should return false if query does not match', () => {
  // Test all data types
  assert.ok(!isQueryMatch(simple, { b: '' }));
  // Test nesting
  assert.ok(!isQueryMatch(complex, { b: [null, 2, 3] }));
  assert.ok(!isQueryMatch(complex, { b: [2, null] }));
  // Test multi match
  assert.ok(!isQueryMatch(simple, { _id: '2', c: null }));
  assert.ok(!isQueryMatch(nested, { _id: '2', b: { c: 'string' } }));
});

test('[isQueryMatch] operator $gt should return true if field is greater than value', () => {
  assert.ok(isQueryMatch(simple, { a: { $gt: 0 } }));
  assert.ok(isQueryMatch(nested, { d: { j: { $gt: 1 } } }));
});

test('[isQuerymatch] operator $gt should return false if field is not greater than value', () => {
  assert.ok(!isQueryMatch(simple, { a: { $gt: 1 } }));
  assert.ok(!isQueryMatch(nested, { d: { j: { $gt: 2 } } }));
});

test('[isQueryMatch] operator $gte should return true if field is greater than or equal to value', () => {
  assert.ok(isQueryMatch(simple, { a: { $gte: 1 } }));
  assert.ok(isQueryMatch(nested, { d: { j: { $gte: 2 } } }));
});

test('[isQueryMatch] operator $gte should return false if field is not greater than or equal to value', () => {
  assert.ok(!isQueryMatch(simple, { a: { $gte: 2 } }));
  assert.ok(!isQueryMatch(nested, { d: { j: { $gte: 3 } } }));
});

test('[isQueryMatch] operator $lt should return true if field is smaller than value', () => {
  assert.ok(isQueryMatch(simple, { a: { $lt: 2 } }));
  assert.ok(isQueryMatch(nested, { d: { j: { $lt: 3 } } }));
});

test('[isQueryMatch] operator $lt should return false if field is not smaller than value', () => {
  assert.ok(!isQueryMatch(simple, { a: { $lt: 1 } }));
  assert.ok(!isQueryMatch(nested, { d: { j: { $lt: 2 } } }));
});

test('[isQueryMatch] operator $lte should return true if field is smaller than or equal to value', () => {
  assert.ok(isQueryMatch(simple, { a: { $lte: 1 } }));
  assert.ok(isQueryMatch(nested, { d: { j: { $lte: 2 } } }));
});

test('[isQueryMatch] operator $lte should return false if value is not less than or equal to value', () => {
  assert.ok(!isQueryMatch(simple, { a: { $lte: 0 } }));
  assert.ok(!isQueryMatch(nested, { d: { j: { $lte: 1 } } }));
});

test('[isQueryMatch] operator $not should return true if field is not equal to value', () => {
  assert.ok(isQueryMatch(simple, { a: { $not: 0 } }));
  assert.ok(isQueryMatch(nested, { b: { c: { $not: 'e' } } }));
});

test('[isQueryMatch] operator $not should return false if field is equal to value', () => {
  assert.ok(!isQueryMatch(simple, { a: { $not: 1 } }));
  assert.ok(!isQueryMatch(nested, { b: { c: { $not: 'string' } } }));
});

test('[isQueryMatch] operator $has should return true if object contains value', () => {
  assert.ok(isQueryMatch(complex, { b: { $has: 2 } }));
  assert.ok(isQueryMatch(complex, { b: { $has: null } }));
  assert.ok(isQueryMatch(complex, { c: { $has: { d: 'String', e: { f: null }, g: true, h: 'string', i: { j: [4, null] } } } }));
});

test('[isQueryMatch] operator $has should return false if object does not contain value', () => {
  assert.ok(!isQueryMatch(complex, { b: { $has: 4 } }));
  assert.ok(!isQueryMatch(complex, { b: { $has: [] } }));
  assert.ok(!isQueryMatch(complex, { c: { $has: { d: 'string' } } }));
});

test('[isQueryMatch] operator $text should return true if query partially matches, case insensitive', () => {
  assert.ok(isQueryMatch(simple, { b: { $text: 'str' } }));
  assert.ok(isQueryMatch(simple, { b: { $text: 'Ing' } }));
  assert.ok(isQueryMatch(simple, { b: { $text: 'STRING' } }));
});

test('[isQueryMatch] operator $text should return false if query partially matches, case insensitive', () => {
  assert.ok(!isQueryMatch(simple, { b: { $text: 'sstring' } }));
  assert.ok(!isQueryMatch(simple, { b: { $text: 'stringg' } }));
});

test('[isQueryMatch] operator $regex should return true if query partially matches, case insensitive', () => {
  assert.ok(isQueryMatch(simple, { b: { $regex: /str/ } }));
});

test('[isQueryMatch] operator $regex should return false if query partially matches, case insensitive', () => {
  assert.ok(!isQueryMatch(simple, { b: { $regex: /STRING/ } }));
});
