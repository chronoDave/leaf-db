import test from 'tape';

import setup, { data } from './fixture';

test('[model.insert] inserts docs', async t => {
  const { db } = setup();

  const docs = db.insert(data);
  t.true(Array.isArray(docs), 'is array');
  t.strictEqual(docs.length, data.length, 'inserts docs');
  t.deepEqual(docs[0], data[0], 'is doc');

  t.end();
});

test('[model.insert] does not insert duplicate docs', async t => {
  const { db } = setup();

  const docs = db.insert([...data, ...data]);
  t.strictEqual(docs.length, data.length, 'does not insert duplicates');

  t.end();
});
