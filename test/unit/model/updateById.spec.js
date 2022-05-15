const test = require('tape');

const { setup, invalidUpdate, mockMemory } = require('../_utils');

test('[updateById] should return empty array on empty', async t => {
  const { db } = setup({ memory: mockMemory });

  const docs = await db.updateById();
  t.equal(docs.length, 0);

  t.end();
});

test('[updateById] should throw on invalid update', async t => {
  const { db } = setup({ memory: mockMemory });

  for (let i = 0; i < invalidUpdate.length; i += 1) {
    try {
      await db.updateById({}, invalidUpdate[i]);
      t.fail(`expected to throw: ${i}, ${invalidUpdate[i]}`);
    } catch (err) {
      t.pass(`throws: ${i}`);
    }
  }

  t.end();
});

test('[updateById] should replace doc if match is found', async t => {
  const _id = 'key_1';
  const { db } = setup({ memory: mockMemory });

  const doc = await db.updateById(_id);

  t.deepEqual(doc, [{ _id }]);
  t.deepEqual(db._memory.get(_id), { _id });
  t.deepEqual(db._memory._docs.get(_id), { _id });

  t.end();
});

test('[updateById] should update doc if match is found', async t => {
  const id = 'key_1';
  const newValue = { testValue: 1 };
  const { db } = setup({ memory: mockMemory });

  const doc = await db.updateById(id, { $set: { newValue } });
  t.deepEqual(doc, [{ ...mockMemory[id], newValue }]);

  t.end();
});

test('[updateById] should accept projection', async t => {
  const id = 'key_1';
  const { db } = setup({ memory: mockMemory });

  const doc = await db.updateById(id, { test: 'test' }, { projection: [] });
  t.deepEqual(doc, [{}]);

  t.end();
});
