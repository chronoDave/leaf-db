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

test('[updateById] should return empty array if no match is found', async t => {
  const { db } = setup({ memory: mockMemory });

  try {
    const docs = await db.updateById('3');

    t.true(Array.isArray(docs));
    t.strictEqual(docs.length, 0);
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[updateById] should throw if array contains invalid values', async t => {
  const { db } = setup({ memory: mockMemory });

  try {
    await db.updateById(invalidQuery);
    t.fail('expected to throw');
  } catch (err) {
    t.pass('throws');
  }

  t.end();
});

test('[updateById] should replace doc if match is found', async t => {
  const _id = 'key_1';

  const { db } = setup({ memory: mockMemory });

  try {
    const docs = await db.updateById(_id);

    t.true(Array.isArray(docs));
    t.strictEqual(docs.length, 1);
    t.deepEqual(docs[0], { _id });
    t.deepEqual(db.map[_id], { _id });
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[updateById] should replace docs if matches are found', async t => {
  const ids = ['key_1', 'key_2', 'key_3'];

  const { db } = setup({ memory: mockMemory });

  try {
    const docs = await db.updateById(ids);

    t.true(Array.isArray(docs));
    t.strictEqual(docs.length, ids.length);

    for (let i = 0; i < docs.length; i += 1) {
      t.deepEqual(docs[i], { _id: ids[i] });
      t.deepEqual(db.map[ids[i]], { _id: ids[i] });
    }
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[updateById] should update doc if match is found', async t => {
  const id = 'key_1';

  const { db } = setup({ memory: mockMemory });

  try {
    const docs = await db.updateById(id, { $set: { testValue: 1 } });

    t.true(Array.isArray(docs));
    t.strictEqual(docs.length, 1);
    t.deepEqual(docs[0], { ...mockMemory[id], testValue: 1 });
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[updateById] should accept projection', async t => {
  const id = 'key_1';

  const { db } = setup({ memory: mockMemory });

  try {
    const docs = await db.updateById(id, { test: 'test' }, []);

    t.deepEqual(docs[0], {});
  } catch (err) {
    t.fail(err);
  }

  t.end();
});
