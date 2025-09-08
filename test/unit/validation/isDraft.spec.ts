import test from 'node:test';
import assert from 'node:assert/strict';

import { production } from './fixture';
import { isDraft } from '../../../src/validation';

test('[isDraft] should return false if doc is invalid', () => {
  assert.ok(!isDraft({ $field: 2 }), 'operator');
  assert.ok(!isDraft({ a: { $field: 2 } }), 'nested operator');
  assert.ok(!isDraft({ a: [{ $field: 2 }] }), 'array nested operator');
});

test('[isDraft] should return true is doc is valid', () => {
  assert.ok(isDraft(production));
  assert.ok(isDraft({}));
  assert.ok(isDraft({ a: null }));
  assert.ok(isDraft({ a: [null] }));
  assert.ok(isDraft({ date: '2010.09.31' }));
  assert.ok(isDraft({ date: {} }));
  assert.ok(isDraft({ a: '反復回転時計' }));
  assert.ok(isDraft({ a: 'a\\null\\undefined' }));
  assert.ok(isDraft({ _id: '1', a: { b: [{ c: [undefined] }] } }));
  assert.ok(isDraft({ 'test.field': 2 }));
  assert.ok(isDraft({ a: { 'test.field': 2 } }));
  assert.ok(isDraft({ a: [{ 'test.field': 2 }] }));
});
