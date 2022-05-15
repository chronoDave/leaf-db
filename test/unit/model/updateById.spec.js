const test = require('tape');

const {
  setup,
  invalidUpdate,
  invalidQuery,
  mockMemory
} = require('../_utils');

test('[updateById] should throw on empty query', async t => {
  const { db } = setup({ memory: mockMemory });

  try {
    await db.updateById();
    t.fail('expected to throw');
  } catch (err) {
    t.pass('throws');
  }

  t.end();
});

test('[updateById] should throw on invalid query', async t => {
  const { db } = setup({ memory: mockMemory });

  for (let i = 0; i < invalidQuery.length; i += 1) {
    try {
      await db.updateById(invalidQuery[i]);
      t.fail(`expected to throw: ${i}, ${invalidQuery[i]}`);
    } catch (err) {
      t.pass(`throws: ${i}`);
    }
  }

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

  try {
    const doc = await db.updateById(_id);

    t.deepEqual(doc, [{ _id }]);
    t.deepEqual(db._memory.get(_id), { _id });
    t.deepEqual(db._memory._map.get(_id), { _id });
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[updateById] should update doc if match is found', async t => {
  const id = 'key_1';
  const newValue = { testValue: 1 };

  const { db } = setup({ memory: mockMemory });

  try {
    const doc = await db.updateById(id, { $set: { newValue } });

    t.deepEqual(doc, [{ ...mockMemory[id], newValue }]);
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[updateById] should accept projection', async t => {
  const id = 'key_1';

  const { db } = setup({ memory: mockMemory });

  try {
    const doc = await db.updateById(id, { test: 'test' }, { projection: [] });

    t.deepEqual(doc, [{}]);
  } catch (err) {
    t.fail(err);
  }

  t.end();
});
