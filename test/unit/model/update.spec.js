const fs = require('fs');

const test = require('tape');

const {
  setup,
  invalidUpdate,
  invalidQueryLoose,
  mockMemory
} = require('../_utils');

test('[update] should throw on invalid query', async t => {
  const { db } = setup({ memory: mockMemory });

  for (let i = 0; i < invalidQueryLoose.length; i += 1) {
    try {
      await db.update(invalidQueryLoose[i]);
      t.fail(`expected to throw: ${i}, ${invalidQueryLoose[i]}`);
    } catch (err) {
      t.pass(`throws: ${i}`);
    }
  }

  t.end();
});

test('[update] should throw on invalid update', async t => {
  const { db } = setup({ memory: mockMemory });

  for (let i = 0; i < invalidUpdate.length; i += 1) {
    try {
      await db.update({}, invalidUpdate[i]);
      t.fail(`expected to throw: ${i}, ${invalidUpdate[i]}`);
    } catch (err) {
      t.pass(`throws: ${i}`);
    }
  }

  t.end();
});

test('[update] should update all data on empty query', async t => {
  const { db } = setup({ memory: mockMemory });

  try {
    const docs = await db.update();

    t.true(Array.isArray(docs));
    t.strictEqual(docs.length, 5);

    for (let i = 0; i < docs.length; i += 1) {
      t.strictEqual(Object.keys(docs[i]).length, 1);
      t.true(docs[i]._id);
    }
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[update] should return empty array if no match is found', async t => {
  const { db } = setup({ memory: mockMemory });

  try {
    const docs = await db.update({ _id: '3' });

    t.true(Array.isArray(docs));
    t.strictEqual(docs.length, 0);
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[update] should replace docs if matches are found (simple)', async t => {
  const { db } = setup({ memory: mockMemory });

  try {
    const docs = await db.update({ data: 'test' });

    t.true(Array.isArray(docs));
    t.strictEqual(docs.length, 1);
    t.strictEqual(Object.keys(docs[0]).length, 1);
    t.true(docs[0]._id);
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[update] should replace docs if matches are found (nested)', async t => {
  const { db } = setup({ memory: mockMemory });

  try {
    const docs = await db.update({ 'data.label': 'test' });

    t.true(Array.isArray(docs));
    t.strictEqual(docs.length, 1);
    t.strictEqual(Object.keys(docs[0]).length, 1);
    t.true(docs[0]._id);
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[update] should replace docs if matches are found (complex)', async t => {
  const { db } = setup({ memory: mockMemory });

  try {
    const docs = await db.update({ $has: { 'data.values': 1 } });

    t.true(Array.isArray(docs));
    t.strictEqual(docs.length, 1);
    t.strictEqual(Object.keys(docs[0]).length, 1);
    t.true(docs[0]._id);
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[update] should update doc if match is found', async t => {
  const { db } = setup({ memory: mockMemory });

  try {
    const docs = await db.update({ data: 'test' }, { $set: { testValue: 1 } });

    t.true(Array.isArray(docs));
    t.strictEqual(docs.length, 1);
    t.deepEqual(docs[0], { ...mockMemory.key_1, testValue: 1 });
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[update] should accept projection', async t => {
  const { db } = setup({ memory: mockMemory });

  try {
    const docs = await db.update({ data: 'test' }, { test: 'test' }, { projection: [] });

    for (let i = 0; i < docs.length; i += 1) {
      t.deepEqual(docs[i], {});
    }
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[update] should persist if `persist` is true', async t => {
  const { db, file } = setup({ data: Object.values(mockMemory), root: __dirname });

  try {
    await db.update({ _id: 'key_4' }, { $set: { testValue: 1 } }, { persist: true });
    db.load();

    t.strictEqual(db.map.key_4.testValue, 1);
  } catch (err) {
    t.fail(err);
  }

  fs.unlinkSync(file);

  t.end();
});
