const test = require('tape');

const { setup, invalidQuery, mockMemory } = require('../_utils');

test('[findOne] should throw on empty query', async t => {
  const { db } = setup({ memory: mockMemory });

  try {
    await db.findOne();
    t.fail('expected to throw');
  } catch (err) {
    t.pass('throws');
  }

  t.end();
});

test('[findOne] should throw on invalid query', async t => {
  const { db } = setup({ memory: mockMemory });

  for (let i = 0; i < invalidQuery.length; i += 1) {
    try {
      await db.findOne(invalidQuery[i]);
      t.fail(`expected to throw: ${i}, ${invalidQuery[i]}`);
    } catch (err) {
      t.pass(`throws: ${i}`);
    }
  }

  t.end();
});

test('[findOne] should return null if no match is found', async t => {
  const { db } = setup({ memory: mockMemory });

  try {
    const doc = await db.findOne('3');

    t.equal(doc, null);
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[findOne] should return null array if match is deleted', async t => {
  const { db } = setup({ memory: mockMemory });

  try {
    const doc = await db.findOne('key_6');

    t.equal(doc, null);
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[findOne] should return doc if match is found', async t => {
  const id = 'key_1';

  const { db } = setup({ memory: mockMemory });

  try {
    const doc = await db.findOne(id);

    t.deepEqual(doc, mockMemory[id]);
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[findOne] should accept projection', async t => {
  const { db } = setup({ memory: mockMemory });

  try {
    const doc = await db.findOne('key_3', []);

    t.deepEqual(doc, {});
  } catch (err) {
    t.fail(err);
  }

  t.end();
});
