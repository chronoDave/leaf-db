const test = require('tape');

const { setup, mockMemory } = require('../_utils');

test('[deleteById] should return 0 on emtpy _id', async t => {
  const { db } = setup({ memory: mockMemory });

  const deleted = await db.deleteById();
  t.strictEqual(deleted, 0);

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
