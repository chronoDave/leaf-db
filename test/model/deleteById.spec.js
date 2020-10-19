const test = require('tape');

const {
  setup,
  invalidQuery,
  mockMemory
} = require('../_utils');

test('[deleteById] should throw on emtpy query', async t => {
  const { db } = setup({ memory: mockMemory });

  try {
    await db.deleteById();
    t.fail('expected to throw');
  } catch (err) {
    t.pass('throws');
  }

  t.end();
});

test('[deleteById] should throw on invalid query', async t => {
  const { db } = setup({ memory: mockMemory });

  for (let i = 0; i < invalidQuery.length; i += 1) {
    try {
      await db.deleteById(invalidQuery[i]);
      t.fail(`expected to throw: ${i}, ${invalidQuery[i]}`);
    } catch (err) {
      t.pass(`throws: ${i}`);
    }
  }

  t.end();
});

test('[deleteById] should return 0 if no match is found', async t => {
  const { db } = setup({ memory: mockMemory });

  try {
    const deleted = await db.deleteById('3');

    t.equal(deleted, 0);
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[deleteById] should throw if array contains invalid values', async t => {
  const { db } = setup({ memory: mockMemory });

  try {
    await db.deleteById(invalidQuery);
    t.fail('expected to throw');
  } catch (err) {
    t.pass('throws');
  }

  t.end();
});

test('[deleteById] should delete doc if match is found', async t => {
  const id = 'key_1';

  const { db } = setup({ memory: mockMemory });

  try {
    const deleted = await db.deleteById(id);

    t.equal(deleted, 1);
    t.ok(db.data[id].$deleted);
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[deleteById] should delete docs if multiple matches are found', async t => {
  const ids = ['key_1', 'key_2'];

  const { db } = setup({ memory: mockMemory });

  try {
    const deleted = await db.deleteById(ids);

    t.equal(deleted, ids.length);
    for (let i = 0; i < ids.length; i += 1) {
      t.ok(db.data[ids[i]].$deleted);
    }
  } catch (err) {
    t.fail(err);
  }

  t.end();
});
