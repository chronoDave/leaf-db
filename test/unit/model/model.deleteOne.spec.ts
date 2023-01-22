import test from 'tape';

import setup, { memory } from './fixture';

test('[model.deleteOne] deletes doc (id)', async t => {
  const { db } = setup({ memory });

  const deleted = await db.deleteOne('key_1');
  t.true(deleted, 'deletes doc');

  t.end();
});

test('[model.deleteOne] deletes doc (simple)', async t => {
  const { db } = setup({ memory });

  const deleted = await db.deleteOne({ shared: true });
  t.true(deleted, 'deletes doc');

  t.end();
});

test('[model.deleteOne] deletes doc (nested)', async t => {
  const { db } = setup({ memory });

  const deleted = await db.deleteOne({ 'data.label': 'test' });
  t.true(deleted, 'deletes doc');

  t.end();
});

test('[model.deleteOne] deletes doc (complex)', async t => {
  const { db } = setup({ memory });

  const deleted = await db.deleteOne({ $includes: { 'data.values': 1 } });
  t.true(deleted, 'deletes doc');

  t.end();
});

test('[model.deleteOne] does not delete doc if no match is found', async t => {
  const { db } = setup({ memory });

  const deleted = await db.deleteOne('e');
  t.false(deleted, 'does not delete doc');

  t.end();
});
