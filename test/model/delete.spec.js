const test = require('tape');

const {
  setup,
  invalidQueryLoose,
  mockMemory
} = require('../_utils');

test('[delete] should throw error on invalid query', async t => {
  const { db } = setup({ memory: mockMemory });

  for (let i = 0; i < invalidQueryLoose.length; i += 1) {
    try {
      await db.delete(invalidQueryLoose[i]);
      t.fail(`expected to throw: ${i}, ${invalidQueryLoose[i]}`);
    } catch (err) {
      t.pass();
    }
  }

  t.end();
});

test('[delete] should delete all data on empty query', async t => {
  const { db } = setup({ memory: mockMemory });

  try {
    const docs = await db.delete();

    t.equal(docs, 5);

    for (let i = 0, v = Object.values(db.data); i < v.length; i += 1) {
      t.ok(v[i].$deleted);
    }
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[delete] should return 0 if no match is found', async t => {
  const { db } = setup({ memory: mockMemory });

  try {
    const docs = await db.delete({ _id: '3' });

    t.equal(docs, 0);
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[delete] should delete docs if matches are found (simple)', async t => {
  const { db } = setup({ memory: mockMemory });

  try {
    const docs = await db.delete({ data: 'test' });

    t.equal(docs, 1);
    t.ok(db.data.key_1.$deleted);
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[delete] should replace docs if matches are found (nested)', async t => {
  const { db } = setup({ memory: mockMemory });

  try {
    const docs = await db.delete({ 'data.label': 'test' });

    t.equal(docs, 1);
    t.ok(db.data.key_5.$deleted);
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[delete] should replace docs if matches are found (complex)', async t => {
  const { db } = setup({ memory: mockMemory });

  try {
    const docs = await db.delete({ $has: { 'data.values': 1 } });

    t.equal(docs, 1);
    t.ok(db.data.key_4.$deleted);
  } catch (err) {
    t.fail(err);
  }

  t.end();
});