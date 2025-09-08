import test from 'node:test';
import assert from 'node:assert/strict';

import Memory from '../../../src/memory';
import { data } from './fixture';

test('[memory.set] sets document', () => {
  const memory = new Memory();

  memory.set(data);

  // @ts-expect-error: Access private
  assert.deepEqual(memory._docs.values().next().value, data, 'sets doc');
});

test('[memory.set] indexes by `_id`', () => {
  const memory = new Memory();

  memory.set(data);

  // @ts-expect-error: Access private
  assert.ok(memory._docs.has(data._id), 'indexes by _id');
});
