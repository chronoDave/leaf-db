import test from 'tape';

import setup, { production } from './fixture';

test('[model.insert] inserts docs', async t => {
  const payload = [production, {}, {}];
  const { db } = setup();

  const docs = await db.insert(payload);
  t.true(Array.isArray(docs), 'is array');
  t.strictEqual(docs.length, payload.length, 'inserts docs');
  t.deepEqual(docs[0], payload[0], 'is doc');

  t.end();
});

test('[model.insert] does not insert duplicate docs', async t => {
  const payload = [production, production, production];
  const { db } = setup();

  const docs = await db.insert(payload);
  t.strictEqual(docs.length, 1, 'does not insert duplicates');

  t.end();
});
