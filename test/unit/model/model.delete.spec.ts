import test from 'tape';

import setup, { memory } from './fixture';

test('[model.delete] deletes docs if matches are found (ids)', async t => {
  const { db } = setup({ memory });

  const docs = await db.delete(['key_1', 'key_2']);
  t.strictEqual(docs, 2, 'deletes docs');

  t.end();
});

test('[model.delete] deletes docs if matches are found (simple)', async t => {
  const { db } = setup({ memory });

  const docs = await db.delete({ shared: true });
  t.strictEqual(docs, 2, 'deletes docs');

  t.end();
});

test('[model.delete] deletes docs if matches are found (nested)', async t => {
  const { db } = setup({ memory });

  const docs = await db.delete({ 'data.label': 'test' });
  t.strictEqual(docs, 1, 'deletes docs');

  t.end();
});

test('[model.delete] deletes docs if matches are found (complex)', async t => {
  const { db } = setup({ memory });

  const docs = await db.delete({ $includes: { 'data.values': 1 } });
  t.strictEqual(docs, 1, 'deletes docs');

  t.end();
});

test('[model.delete] returns 0 if no match is found', async t => {
  const { db } = setup({ memory });

  const docs = await db.delete({ _id: '3' });
  t.strictEqual(docs, 0, 'does not delete docs');

  t.end();
});
