const test = require('tape');

const { setup, invalidData, mockMemory } = require('../_utils');

test('[insertOne] should throw on invalid data', async t => {
  const { db } = setup();

  for (let i = 0; i < invalidData.length; i += 1) {
    try {
      await db.insertOne(invalidData[i], { strict: true });
      t.fail(`expected to throw: ${i}, ${invalidData[i]}`);
    } catch (err) {
      t.pass(`throws: ${i}`);
    }
  }

  t.end();
});

test('[insertOne] should throw if doc already exists', async t => {
  const payload = { _id: 'key_1' };

  const { db } = setup({ memory: mockMemory });

  try {
    await db.insertOne(payload, { strict: true });
    t.fail('expected to throw on duplicate id');
  } catch (err) {
    t.pass('throws');
  }
});

test('[insertOne] should insert single doc', async t => {
  const payload = { _id: 'key_1' };

  const { db } = setup();

  try {
    const doc = await db.insertOne(payload);

    t.deepEqual(doc, payload, 'should return doc');
    t.strictEqual(Object.keys(db.map).length, 1, 'should have map data');
    t.deepEqual(db.map[payload._id], payload, 'should set map data');
    t.strictEqual(db.list.size, 1, 'should have list data');
    t.strictEqual(db.list.values().next().value, payload._id, 'should set list data');
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[insertOne] should add doc _id if it does not exist', async t => {
  const { db } = setup();

  try {
    const doc = await db.insertOne({});

    t.true(doc._id);
  } catch (err) {
    t.fail(err);
  }

  t.end();
});
