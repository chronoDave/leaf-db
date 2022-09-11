const test = require('tape');

const { setup, mockMemory } = require('../_utils');

test('[model.update] replaces docs if matches are found (ids)', async t => {
  const { db } = setup({ memory: mockMemory });

  const docs = await db.update(['key_1', 'key_2', 'key_0'], {});
  t.true(Array.isArray(docs), 'is array');
  t.strictEqual(docs.length, 2, 'found docs');
  t.strictEqual(Object.keys(docs[0]).length, 1, 'replaced doc');
  t.true(docs[0]._id, 'persisted property `_id`');

  t.end();
});

test('[model.update] replaces docs if matches are found (simple)', async t => {
  const { db } = setup({ memory: mockMemory });

  const docs = await db.update({ shared: true }, {});
  t.strictEqual(docs.length, 2, 'replaced docs');

  t.end();
});

test('[model.update] replaces docs if matches are found (nested)', async t => {
  const { db } = setup({ memory: mockMemory });

  const docs = await db.update({ 'data.label': 'test' }, {});
  t.strictEqual(docs.length, 1, 'replaced docs');

  t.end();
});

test('[model.update] replaces docs if matches are found (complex)', async t => {
  const { db } = setup({ memory: mockMemory });

  const docs = await db.update({ $includes: { 'data.values': 1 } }, {});
  t.strictEqual(docs.length, 1, 'replaced docs');

  t.end();
});

test('[model.update] returns empty array if no match is found', async t => {
  const { db } = setup({ memory: mockMemory });

  const docs = await db.update({ _id: '3' }, {});
  t.strictEqual(docs.length, 0, 'is empty');

  t.end();
});

test('[model.update] updates doc if match is found', async t => {
  const { db } = setup({ memory: mockMemory });

  const docs = await db.update({ data: 'test' }, { $set: { testValue: 1 } }, {});
  t.deepEqual(docs[0], { ...mockMemory.key_1, testValue: 1 }, 'updated doc');

  t.end();
});

test('[model.update] projects', async t => {
  const { db } = setup({ memory: mockMemory });

  const docs = await db.update({ data: 'test' }, { test: 'test' }, { projection: [] });
  for (let i = 0; i < docs.length; i += 1) {
    t.deepEqual(docs[i], {}, 'projects');
  }

  t.end();
});