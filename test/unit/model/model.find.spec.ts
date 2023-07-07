import test from 'tape';

import setup, { memory } from './fixture';

test('[model.find] returns docs on empty query', async t => {
  const { db } = setup({ memory });

  const docs = await db.find({});
  t.true(Array.isArray(docs), 'is array');
  t.strictEqual(docs.length, Object.keys(memory).length, 'finds docs');

  t.end();
});

test('[model.find] returns docs on query match (ids)', async t => {
  const { db } = setup({ memory });

  const docs = await db.find(['1', '2', '-1']);
  t.true(Array.isArray(docs), 'is array');
  t.strictEqual(docs.length, 2, 'finds docs');
  t.deepEqual(docs[0], memory['1'], 'is doc');

  t.end();
});

test('[model.find] returns docs on query match (simple)', async t => {
  const { db } = setup({ memory });

  const docs = await db.find({ nametype: 'Valid' });
  t.strictEqual(docs.length, 1000, 'finds docs');

  t.end();
});

test('[model.find] returns docs on query match (nested)', async t => {
  const { db } = setup({ memory });

  const docs = await db.find({ 'geolocation.type': 'Point' });
  t.strictEqual(docs.length, 988, 'finds docs');

  t.end();
});

test('[model.find] returns docs on query match (complex)', async t => {
  const { db } = setup({ memory });

  const docs = await db.find({ $includes: { 'geolocation.coordinates': 56.18333 } });
  t.strictEqual(docs.length, 1, 'finds docs');

  t.end();
});
