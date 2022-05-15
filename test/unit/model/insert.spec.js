const test = require('tape');

const { setup, mockObjectProduction } = require('../_utils');

test('[insert] should accept single doc', async t => {
  const payload = { _id: '1' };
  const { db } = setup();

  const doc = await db.insert(payload);
  t.true(Array.isArray(doc));
  t.strictEqual(doc.length, 1);
  t.deepEqual(doc[0], payload);

  t.end();
});

test('[insert] should accept multiple docs', async t => {
  const payload = [mockObjectProduction, mockObjectProduction, mockObjectProduction];
  const { db } = setup();

  const docs = await db.insert(payload);
  t.true(Array.isArray(docs));
  t.strictEqual(docs.length, payload.length);

  const { _id, ...sample } = docs[0];
  t.deepEqual(sample, payload[0]);

  t.end();
});
