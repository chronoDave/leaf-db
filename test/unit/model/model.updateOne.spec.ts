import test from 'tape';

import setup, { memory } from './fixture';

test('[model.updateOne] returns null if no match is found', async t => {
  const { db } = setup({ memory });

  const doc = await db.updateOne('key_6', {});
  t.false(doc, 'is null');

  t.end();
});

test('[model.updateOne] replaces doc if match is found (id)', async t => {
  const _id = '1';
  const { db } = setup({ memory });

  const doc = await db.updateOne(_id, {});

  t.deepEqual(doc, { _id }, 'replaced doc');
  // @ts-expect-error: Access private
  t.deepEqual(db._memory.get(_id), { _id }, 'replaced doc in memory');

  t.end();
});

test('[model.updateOne] replaces doc if match is found (simple)', async t => {
  const { db } = setup({ memory });

  const doc = await db.updateOne({ nametype: 'Valid' }, {});

  t.true(doc, 'replaced doc');

  t.end();
});

test('[model.updateOne] replaces doc if match is found (nested)', async t => {
  const { db } = setup({ memory });

  const doc = await db.updateOne({ geolocation: { type: 'Point' } }, {});

  t.true(doc, 'replaced doc');

  t.end();
});

test('[model.updateOne] replaces doc if match is found (complex)', async t => {
  const { db } = setup({ memory });

  const doc = await db.updateOne({ geolocation: { coordinates: { $has: 56.18333 } } }, {});

  t.true(doc, 'replaced doc');

  t.end();
});

test('[model.updateOne] updates doc if match is found', async t => {
  const id = '1';
  const newValue = { testValue: 1 };
  const { db } = setup({ memory });

  const doc = await db.updateOne(id, { $set: { newValue } });
  t.deepEqual(doc, { ...memory[id], newValue }, 'updates doc');

  t.end();
});
