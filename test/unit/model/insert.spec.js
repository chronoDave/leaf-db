const test = require('tape');

const { setup, mockObjectProduction } = require('../_utils');

test('[insert] should accept single doc', async t => {
  const payload = { _id: 1 };

  const { db } = setup();

  try {
    const doc = await db.insert(payload);

    t.true(Array.isArray(doc));
    t.strictEqual(doc.length, 1);
    t.deepEqual(doc[0], payload);
  } catch (err) {
    t.error(err);
  }
});

test('[insert] should accept multiple docs', async t => {
  const payload = [mockObjectProduction, mockObjectProduction, mockObjectProduction];

  const { db } = setup();

  try {
    const docs = await db.insert(payload);

    t.true(Array.isArray(docs));
    t.strictEqual(docs.length, payload.length);

    const { _id, ...sample } = docs[0];

    t.deepEqual(sample, payload[0]);
  } catch (err) {
    t.error(err);
  }
});
