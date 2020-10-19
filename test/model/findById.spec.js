const test = require('tape');

const {
  setup,
  invalidQuery,
  mockMemory
} = require('../_utils');

test('[findById] should throw on empty query', async t => {
  const { db } = setup({ memory: mockMemory });

  try {
    await db.findById();
    t.fail('expected to throw');
  } catch (err) {
    t.pass('throws');
  }

  t.end();
});

test('[findById] should throw on invalid query', async t => {
  const { db } = setup({ memory: mockMemory });

  for (let i = 0; i < invalidQuery.length; i += 1) {
    try {
      await db.findById(invalidQuery[i]);
      t.fail(`expected to throw: ${i}, ${invalidQuery[i]}`);
    } catch (err) {
      t.pass(`throws: ${i}`);
    }
  }

  t.end();
});

test('[findById] should return empty array if no match is found', async t => {
  const { db } = setup({ memory: mockMemory });

  try {
    const docs = await db.findById('3');

    t.ok(Array.isArray(docs));
    t.equal(docs.length, 0);
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[findById] should throw if array contains invalid values', async t => {
  const { db } = setup({ memory: mockMemory });

  try {
    await db.findById(invalidQuery);
    t.fail('expected to throw');
  } catch (err) {
    t.pass('throws');
  }

  t.end();
});

test('[findById] should return doc if match is found', async t => {
  const id = 'key_1';

  const { db } = setup({ memory: mockMemory });

  try {
    const docs = await db.findById(id);

    t.ok(Array.isArray(docs));
    t.equal(docs.length, 1);
    t.deepEqual(docs[0], mockMemory[id]);
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[findById] should return doc if match is found', async t => {
  const id = 'key_1';

  const { db } = setup({ memory: mockMemory });

  try {
    const docs = await db.findById(id);

    t.ok(Array.isArray(docs));
    t.equal(docs.length, 1);
    t.deepEqual(docs[0], mockMemory[id]);
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[findById] should return docs if multiple matches are found', async t => {
  const ids = ['key_1', 'key_2'];

  const { db } = setup({ memory: mockMemory });

  try {
    const docs = await db.findById(ids);

    t.ok(Array.isArray(docs));
    t.equal(docs.length, 2);

    for (let i = 0; i < docs.length; i += 1) {
      t.deepEqual(docs[i], mockMemory[ids[i]]);
    }
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[findById] should accept projection', async t => {
  const { db } = setup({ memory: mockMemory });

  try {
    const docs = await db.findById('3', []);

    t.deepEqual(docs[0], {});
  } catch (err) {
    t.fail(err);
  }

  t.end();
});
