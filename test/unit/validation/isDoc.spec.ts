import test from 'node:test';
import assert from 'node:assert/strict';

import { isDoc } from '../../../src/validation';

test('[isDoc] should return false if doc is invalid', () => {
  assert.ok(!isDoc({ _id: undefined }), '_id undefined');
  assert.ok(!isDoc({ _id: { a: undefined } }), '_id object');
  assert.ok(!isDoc({ _id: [{ a: undefined }] }), '_id array');
});

test('[isDoc] should return true is doc is valid', () => {
  assert.ok(isDoc({ _id: '3' }));
});
