const test = require('tape');

const { setup, invalidQuery, mockMemory } = require('../_utils');

test('[findById] should throw on empty _id', async t => {
  const { db } = setup({ memory: mockMemory });

  try {
    await db.findById();
    t.fail('expected to throw');
  } catch (err) {
    t.pass('throws');
  }

  t.end();
});

test('[findById] should throw on invalid _id', async t => {
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

test('[findById] should return null if no match is found', async t => {
  const payload = '3';

  const { db } = setup({ memory: mockMemory });

  try {
    const doc = await db.findById(payload);

    t.equal(doc, null);
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[findById] should return null if match is deleted', async t => {
  const payload = mockMemory.key_6._id;

  const { db } = setup({ memory: mockMemory });

  try {
    const doc = await db.findById(payload);

    t.equal(doc, null);
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[findById] should return doc if match is found', async t => {
  const id = mockMemory.key_1._id;

  const { db } = setup({ memory: mockMemory });

  try {
    const doc = await db.findById(id);

    t.deepEqual(doc, mockMemory[id]);
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[findById] should accept projection', async t => {
  const id = mockMemory.key_1._id;

  const { db } = setup({ memory: mockMemory });

  try {
    const doc = await db.findById(id, []);

    t.deepEqual(doc, {});
  } catch (err) {
    t.fail(err);
  }

  t.end();
});
