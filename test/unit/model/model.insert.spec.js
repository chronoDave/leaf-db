const test = require('tape');

const { setup, mockObjectProduction } = require('../_utils');

test('[model.insert] inserts docs', async t => {
  const payload = [mockObjectProduction, mockObjectProduction, mockObjectProduction];
  const { db } = setup();

  const docs = await db.insert(payload);
  t.true(Array.isArray(docs), 'is array');
  t.strictEqual(docs.length, payload.length, 'inserts docs');

  const { _id, ...sample } = docs[0];
  t.deepEqual(sample, payload[0], 'is doc');

  t.end();
});

test('[model.insert] ignores invalid docs', async t => {
  const payload = [mockObjectProduction, mockObjectProduction, mockObjectProduction, 3];
  const { db } = setup();

  const docs = await db.insert(payload);
  t.strictEqual(docs.length, payload.length - 1, 'ignores invalid');

  t.end();
});
