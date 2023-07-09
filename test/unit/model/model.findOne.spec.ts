import test from 'tape';

import setup, { memory } from './fixture';

test('[model.findOne] returns null if no match is found', async t => {
  const { db } = setup({ memory });

  const doc = await db.findOne('e');
  t.false(doc, 'null');

  t.end();
});

test('[model.findOne] finds doc (id)', async t => {
  const { db } = setup({ memory });

  const doc = await db.findOne('24019');
  t.true(doc, 'found doc');

  t.end();
});

test('[model.findOne] finds doc (simple)', async t => {
  const { db } = setup({ memory });

  const doc = await db.findOne({ mass: '20000' });
  t.true(doc, 'found doc');

  t.end();
});

test('[model.findOne] finds doc (nested)', async t => {
  const { db } = setup({ memory });

  const doc = await db.findOne({ geolocation: { type: 'Point' } });
  t.true(doc, 'found doc');

  t.end();
});

test('[model.findOne] finds doc (complex)', async t => {
  const { db } = setup({ memory });

  const doc = await db.findOne({ geolocation: { coordinates: { $has: 111.53333 } } });
  t.true(doc, 'found doc');

  t.end();
});
