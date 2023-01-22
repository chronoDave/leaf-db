import test from 'tape';

import setup, { memory } from './fixture';

test('[model.update] replaces docs if matches are found (ids)', async t => {
  const { db } = setup({ memory });

  const docs = await db.update(['key_1', 'key_2', 'key_0'], {});
  t.true(Array.isArray(docs), 'is array');
  t.strictEqual(docs.length, 2, 'found docs');
  t.strictEqual(Object.keys(docs[0]).length, 1, 'replaced doc');
  t.true(docs[0]._id, 'persisted property `_id`');

  t.end();
});

test('[model.update] replaces docs if matches are found (simple)', async t => {
  const { db } = setup({ memory });

  const docs = await db.update({ shared: true }, {});
  t.strictEqual(docs.length, 2, 'replaced docs');

  t.end();
});

test('[model.update] replaces docs if matches are found (nested)', async t => {
  const { db } = setup({ memory });

  const docs = await db.update({ 'data.label': 'test' }, {});
  t.strictEqual(docs.length, 1, 'replaced docs');

  t.end();
});

test('[model.update] replaces docs if matches are found (complex)', async t => {
  const { db } = setup({ memory });

  const docs = await db.update({ $includes: { 'data.values': 1 } }, {});
  t.strictEqual(docs.length, 1, 'replaced docs');

  t.end();
});

test('[model.update] returns empty array if no match is found', async t => {
  const { db } = setup({ memory });

  const docs = await db.update({ _id: '3' }, {});
  t.strictEqual(docs.length, 0, 'is empty');

  t.end();
});

test('[model.update] updates doc if match is found', async t => {
  const { db } = setup({ memory });

  const docs = await db.update({ data: 'test' }, { $set: { testValue: {} } });
  t.deepEqual(docs[0], { ...memory.key_1, testValue: {} }, 'updated doc');

  t.end();
});
