const test = require('tape');

const { setup, invalidQuery, mockMemory } = require('../_utils');

test('[findMany] should throw on empty query', async t => {
  const { db } = setup({ memory: mockMemory });

  try {
    await db.findMany();
    t.fail('expected to throw');
  } catch (err) {
    t.pass('throws');
  }

  t.end();
});

test('[findMany] should throw on invalid query', async t => {
  const { db } = setup({ memory: mockMemory });

  for (let i = 0; i < invalidQuery.length; i += 1) {
    try {
      await db.findMany(invalidQuery[i]);
      t.fail(`expected to throw: ${i}, ${invalidQuery[i]}`);
    } catch (err) {
      t.pass(`throws: ${i}`);
    }
  }

  t.end();
});

test('[findMany] should throw if array contains invalid values', async t => {
  const { db } = setup({ memory: mockMemory });

  try {
    await db.findMany(invalidQuery);
    t.fail('expected to throw');
  } catch (err) {
    t.pass('throws');
  }

  t.end();
});

test('[findMany] should return empty array if no match is found', async t => {
  const { db } = setup({ memory: mockMemory });

  try {
    const docs = await db.findMany(['3']);

    t.true(Array.isArray(docs));
    t.strictEqual(docs.length, 0);
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[findMany] should return empty array if match is deleted', async t => {
  const { db } = setup({ memory: mockMemory });

  try {
    const docs = await db.findMany(['key_6']);

    t.true(Array.isArray(docs));
    t.strictEqual(docs.length, 0);
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[findMany] should return docs if matches are found', async t => {
  const ids = ['key_1', 'key_2'];

  const { db } = setup({ memory: mockMemory });

  try {
    const docs = await db.findMany(ids);

    t.true(Array.isArray(docs));
    t.strictEqual(docs.length, 2);

    for (let i = 0; i < docs.length; i += 1) {
      t.deepEqual(docs[i], mockMemory[ids[i]]);
    }
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[findMany] should accept projection', async t => {
  const { db } = setup({ memory: mockMemory });

  try {
    const docs = await db.findMany(['key_3'], []);

    t.deepEqual(docs[0], {});
  } catch (err) {
    t.fail(err);
  }

  t.end();
});
