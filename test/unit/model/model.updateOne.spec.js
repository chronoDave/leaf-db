const test = require('tape');

const { setup, mockMemory } = require('../_utils');

test('[model.updateOne] returns null if no match is found', async t => {
  const { db } = setup({ memory: mockMemory });

  const doc = await db.updateOne('key_6', {});
  t.false(doc, 'is null');

  t.end();
});

test('[model.updateOne] replaces doc if match is found (id)', async t => {
  const _id = 'key_1';
  const { db } = setup({ memory: mockMemory });

  const doc = await db.updateOne(_id, {});

  t.deepEqual(doc, { _id }, 'replaced doc');
  t.deepEqual(db._memory.get(_id), { _id }, 'replaced doc in memory');

  t.end();
});

test('[model.updateOne] replaces doc if match is found (simple)', async t => {
  const { db } = setup({ memory: mockMemory });

  const doc = await db.updateOne({ shared: true }, {});

  t.true(doc, 'replaced doc');

  t.end();
});

test('[model.updateOne] replaces doc if match is found (nested)', async t => {
  const { db } = setup({ memory: mockMemory });

  const doc = await db.updateOne({ 'data.label': 'test' }, {});

  t.true(doc, 'replaced doc');

  t.end();
});

test('[model.updateOne] replaces doc if match is found (complex)', async t => {
  const { db } = setup({ memory: mockMemory });

  const doc = await db.updateOne({ $includes: { 'data.values': 1 } }, {});

  t.true(doc, 'replaced doc');

  t.end();
});

test('[model.updateOne] updates doc if match is found', async t => {
  const id = 'key_1';
  const newValue = { testValue: 1 };
  const { db } = setup({ memory: mockMemory });

  const doc = await db.updateOne(id, { $set: { newValue } });
  t.deepEqual(doc, { ...mockMemory[id], newValue }, 'updates doc');

  t.end();
});
