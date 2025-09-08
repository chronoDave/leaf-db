import test from 'node:test';
import assert from 'node:assert/strict';

import Memory from './memory.ts';
import { data } from './memory.struct.ts';

test('[memory.get]', async t => {
  await t.test('should return document', () => {
    const memory = new Memory();

    // @ts-expect-error: Access private
    memory._docs.set(data._id, data);

    assert.deepEqual(memory.get(data._id), data, 'returns doc');
  });

  await t.test('should return null if document does not exist', () => {
    const memory = new Memory();

    assert.equal(memory.get(data._id), null, 'returns null');
  });
});

test('[memory.set]', async t => {
  await t.test('[memory.set] sets document', () => {
    const memory = new Memory();

    memory.set(data);

    // @ts-expect-error: Access private
    assert.deepEqual(memory._docs.values().next().value, data, 'sets doc');
  });

  await t.test('[memory.set] indexes by `_id`', () => {
    const memory = new Memory();

    memory.set(data);

    // @ts-expect-error: Access private
    assert.ok(memory._docs.has(data._id), 'indexes by _id');
  });
});

test('[memory.delete]', async t => {
  await t.test('[memory.delete] should delete document', () => {
    const memory = new Memory();
    // @ts-expect-error: Access private
    memory._docs.set(data._id, data);

    assert.ok(memory.delete(data._id), 'deletes doc');
    // @ts-expect-error: Access private
    assert.ok(!memory._docs.has(data._id), 'doc does not exist');
  });

  await t.test('[memory.delete] should return false if doc does not exist', () => {
    const memory = new Memory();

    assert.ok(!memory.delete(data._id));
  });
});
