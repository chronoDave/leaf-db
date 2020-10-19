const test = require('tape');

const {
  setup,
  invalidQueryLoose,
  mockMemory
} = require('../_utils');

test('[find] should throw on invalid query', async t => {
  const { db } = setup({ memory: mockMemory });

  for (let i = 0; i < invalidQueryLoose.length; i += 1) {
    try {
      await db.find(invalidQueryLoose[i]);
      t.fail(`expected to throw: ${i}, ${invalidQueryLoose[i]}`);
    } catch (err) {
      t.pass(`throws: ${i}`);
    }
  }

  t.end();
});

test('[find] should return all data on empty query', async t => {
  const { db } = setup({ memory: mockMemory });

  try {
    const docs = await db.find();

    t.ok(Array.isArray(docs));
    t.equal(docs.length, Object.keys(mockMemory).length);
    t.ok(typeof docs[0] === 'object');
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[find] should return docs on query match (simple)', async t => {
  const { db } = setup({ memory: mockMemory });

  try {
    const docs = await db.find({ data: 'test' });

    t.ok(Array.isArray(docs));
    t.equal(docs.length, 1);
    t.deepEqual(docs[0], mockMemory.key_1);
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[find] should return docs on query match (nested)', async t => {
  const { db } = setup({ memory: mockMemory });

  try {
    const docs = await db.find({ 'data.label': 'test' });

    t.ok(Array.isArray(docs));
    t.equal(docs.length, 1);
    t.deepEqual(docs[0], mockMemory.key_5);
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[find] should return docs on query match (complex)', async t => {
  const { db } = setup({ memory: mockMemory });

  try {
    const docs = await db.find({ $has: { 'data.values': 1 } });

    t.ok(Array.isArray(docs));
    t.equal(docs.length, 1);
    t.deepEqual(docs[0], mockMemory.key_4);
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[find] should accept projection', async t => {
  const { db } = setup({ memory: mockMemory });

  try {
    const docs = await db.find({}, []);

    for (let i = 0; i < docs.length; i += 1) {
      t.deepEqual(docs[i], {});
    }
  } catch (err) {
    t.fail(err);
  }

  t.end();
});
