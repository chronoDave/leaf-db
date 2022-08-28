const test = require('tape');

const { setup, invalidData, mockMemory } = require('../_utils');

test('[model.insertOne] throws on invalid data', async t => {
  const { db } = setup({ strict: true });

  for (let i = 0; i < invalidData.length; i += 1) {
    try {
      await db.insertOne(invalidData[i]);
      t.fail(`expected to throw: ${i}, ${invalidData[i]}`);
    } catch (err) {
      t.pass(`throws: ${i}`);
    }
  }

  t.end();
});

test('[model.insertOne] throws if doc already exists', async t => {
  const payload = { _id: 'key_1' };
  const { db } = setup({ memory: mockMemory, strict: true });

  try {
    await db.insertOne(payload);
    t.fail('expected to throw on duplicate id');
  } catch (err) {
    t.pass('throws');
  }

  t.end();
});

test('[model.insertOne] inserts doc', async t => {
  const payload = { _id: 'key_1' };
  const { db } = setup();

  const doc = await db.insertOne(payload);

  t.deepEqual(doc, payload, 'returns doc');
  t.deepEqual(db._memory._docs.get(payload._id), payload, 'sets map data');

  t.end();
});

test('[model.insertOne] adds doc _id if it does not exist', async t => {
  const { db } = setup();

  const doc = await db.insertOne({});
  t.true(doc._id, 'appends _id');

  t.end();
});
