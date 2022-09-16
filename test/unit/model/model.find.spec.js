const test = require('tape');

const { setup, mockMemory } = require('../_utils');

test('[model.find] returns docs on query match (ids)', async t => {
  const { db } = setup({ memory: mockMemory });

  const docs = await db.find([mockMemory.key_1._id, mockMemory.key_2._id, 'e']);
  t.true(Array.isArray(docs), 'is array');
  t.strictEqual(docs.length, 2, 'finds docs');
  t.deepEqual(docs[0], mockMemory.key_1, 'is doc');

  t.end();
});

test('[model.find] returns docs on query match (simple)', async t => {
  const { db } = setup({ memory: mockMemory });

  const docs = await db.find({ shared: true });
  t.strictEqual(docs.length, 2, 'finds docs');

  t.end();
});

test('[model.find] returns docs on query match (nested)', async t => {
  const { db } = setup({ memory: mockMemory });

  const docs = await db.find({ 'data.label': 'test' });
  t.strictEqual(docs.length, 1, 'finds docs');

  t.end();
});

test('[model.find] returns docs on query match (complex)', async t => {
  const { db } = setup({ memory: mockMemory });

  const docs = await db.find({ $includes: { 'data.values': 1 } });
  t.strictEqual(docs.length, 1, 'finds docs');

  t.end();
});
