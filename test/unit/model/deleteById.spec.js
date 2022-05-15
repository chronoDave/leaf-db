const test = require('tape');

const { setup, invalidQuery, mockMemory } = require('../_utils');

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
  const _id = '3';
  const { db } = setup({ memory: mockMemory });

  const deleted = await db.deleteById(_id);
  t.strictEqual(deleted, 0);

  t.end();
});

test('[deleteById] should delete doc if match is found', async t => {
  const id = 'key_1';
  const { db } = setup({ memory: mockMemory });

  const deleted = await db.deleteById(id);
  t.strictEqual(deleted, 1);

  t.end();
});
