import test from 'node:test';
import assert from 'node:assert/strict';

import Memory from '../../../src/lib/memory.ts';
import { data } from './fixture.ts';

test('[memory.get] should return document', () => {
  const memory = new Memory();

  // @ts-expect-error: Access private
  memory._docs.set(data._id, data);

  assert.deepEqual(memory.get(data._id), data, 'returns doc');
});

test('[memory.get] should return null if document does not exist', () => {
  const memory = new Memory();

  assert.equal(memory.get(data._id), null, 'returns null');
});
