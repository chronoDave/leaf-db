const test = require('tape');

const { setup, mockMemory } = require('../_utils');

test('[model.findOne] returns null if no match is found', async t => {
  const { db } = setup({ memory: mockMemory });

  const doc = await db.findOne('e');
  t.false(doc, 'null');

  t.end();
});

test('[model.findOne] finds doc (id)', async t => {
  const { db } = setup({ memory: mockMemory });

  const doc = await db.findOne('key_1');
  t.true(doc, 'found doc');

  t.end();
});

test('[model.findOne] finds doc (simple)', async t => {
  const { db } = setup({ memory: mockMemory });

  const doc = await db.findOne({ shared: true });
  t.true(doc, 'found doc');

  t.end();
});

test('[model.findOne] finds doc (nested)', async t => {
  const { db } = setup({ memory: mockMemory });

  const doc = await db.findOne({ 'data.label': 'test' });
  t.true(doc, 'found doc');

  t.end();
});

test('[model.findOne] finds doc (complex)', async t => {
  const { db } = setup({ memory: mockMemory });

  const doc = await db.findOne({ $includes: { 'data.values': 1 } });
  t.true(doc, 'found doc');

  t.end();
});
