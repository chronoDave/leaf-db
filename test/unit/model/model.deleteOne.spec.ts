import test from 'tape';

import setup, { memory } from './fixture';

test('[model.deleteOne] deletes doc (id)', async t => {
  const { db } = setup({ memory });

  const deleted = await db.deleteOne('1');
  t.true(deleted, 'deletes doc');

  t.end();
});

test('[model.deleteOne] deletes doc (simple)', async t => {
  const { db } = setup({ memory });

  const deleted = await db.deleteOne({ nametype: 'Valid' });
  t.true(deleted, 'deletes doc');

  t.end();
});

test('[model.deleteOne] deletes doc (nested)', async t => {
  const { db } = setup({ memory });

  const deleted = await db.deleteOne({ 'geolocation.type': 'Point' });
  t.true(deleted, 'deletes doc');

  t.end();
});

test('[model.deleteOne] deletes doc (complex)', async t => {
  const { db } = setup({ memory });

  const deleted = await db.deleteOne({ $includes: { 'geolocation.coordinates': 56.18333 } });
  t.true(deleted, 'deletes doc');

  t.end();
});

test('[model.deleteOne] does not delete doc if no match is found', async t => {
  const { db } = setup({ memory });

  const deleted = await db.deleteOne('-1');
  t.false(deleted, 'does not delete doc');

  t.end();
});
