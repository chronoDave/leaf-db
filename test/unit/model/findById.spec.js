const test = require('tape');

const { setup, mockMemory } = require('../_utils');

test('[findById] should return empty array on empty _id', async t => {
  const { db } = setup({ memory: mockMemory });

  const doc = await db.findById();
  t.deepEqual(doc, []);

  t.end();
});

test('[findById] should return empty array if no match is found', async t => {
  const payload = '3';
  const { db } = setup({ memory: mockMemory });

  const doc = await db.findById(payload);
  t.deepEqual(doc, []);

  t.end();
});

test('[findById] should return doc if match is found', async t => {
  const id = mockMemory.key_1._id;
  const { db } = setup({ memory: mockMemory });

  const doc = await db.findById(id);
  t.deepEqual(doc[0], mockMemory[id]);

  t.end();
});

test('[findById] should accept projection', async t => {
  const id = mockMemory.key_1._id;
  const { db } = setup({ memory: mockMemory });

  const doc = await db.findById(id, { projection: [] });
  t.deepEqual(doc, [{}]);

  t.end();
});
