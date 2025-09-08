import test from 'node:test';
import assert from 'node:assert/strict';

import Memory from '../../../src/lib/memory.ts';
import { data } from './fixture.ts';

test('[memory.delete] should delete document', () => {
  const memory = new Memory();
  // @ts-expect-error: Access private
  memory._docs.set(data._id, data);

  assert.ok(memory.delete(data._id), 'deletes doc');
  // @ts-expect-error: Access private
  assert.ok(!memory._docs.has(data._id), 'doc does not exist');
});

test('[memory.delete] should return false if doc does not exist', () => {
  const memory = new Memory();

  assert.ok(!memory.delete(data._id));
});
