import test from 'tape';

import setup, { memory } from './fixture';

test('[model.delete] deletes docs if matches are found (ids)', async t => {
  const { db } = setup({ memory });

  const docs = await db.delete(['1', '2']);
  t.strictEqual(docs, 2, 'deletes docs');

  t.end();
});

test('[model.delete] deletes docs if matches are found (simple)', async t => {
  const { db } = setup({ memory });

  const docs = await db.delete({ mass: '720' });
  t.strictEqual(docs, 2, 'deletes docs');

  t.end();
});

test('[model.delete] deletes docs if matches are found (nested)', async t => {
  const { db } = setup({ memory });

  const docs = await db.delete({ geolocation: { type: 'Point' } });
  t.strictEqual(docs, 988, 'deletes docs');

  t.end();
});

test('[model.delete] deletes docs if matches are found (complex)', async t => {
  const { db } = setup({ memory });

  const docs = await db.delete({ geolocation: { coordinates: { $has: 10.23333 } } });
  t.strictEqual(docs, 1, 'deletes docs');

  t.end();
});

test('[model.delete] returns 0 if no match is found', async t => {
  const { db } = setup({ memory });

  const docs = await db.delete({ _id: '-1' });
  t.strictEqual(docs, 0, 'does not delete docs');

  t.end();
});
