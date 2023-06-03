import test from 'tape';

import setup, { memory } from './fixture';

test('[model.insertOne] throws if doc already exists', async t => {
  const payload = { _id: '1' };
  const { db } = setup({ memory, strict: true });

  try {
    db.insertOne(payload);
    t.fail('expected to throw on duplicate id');
  } catch (err) {
    t.pass('throws');
  }

  t.end();
});

test('[model.insertOne] inserts doc', async t => {
  const payload = { _id: 'key_1' };
  const { db } = setup();

  const doc = db.insertOne(payload);

  t.deepEqual(doc, payload, 'returns doc');
  // @ts-expect-error: Access private
  t.deepEqual(db._memory._docs.get(payload._id), payload, 'sets map data');

  t.end();
});

test('[model.insertOne] adds doc _id if it does not exist', async t => {
  const { db } = setup();

  const doc = db.insertOne({});
  t.true(doc?._id, 'appends _id');

  t.end();
});
