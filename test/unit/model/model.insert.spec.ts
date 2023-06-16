import test from 'tape';

import setup, { data } from './fixture';

test('[model.insert] inserts docs', t => {
  const { db } = setup();

  const docs = db.insert(data);
  t.true(Array.isArray(docs), 'is array');
  t.strictEqual(docs.length, data.length, 'inserts docs');
  t.deepEqual(docs[0], data[0], 'is doc');

  t.end();
});

test('[model.insert] does not insert duplicate docs', t => {
  const { db } = setup();

  const docs = db.insert([...data, ...data]);
  t.equal(docs.length, data.length, 'does not insert duplicates');

  t.end();
});

test('[model.insert] inserts duplicate drafts', t => {
  const { db } = setup();

  const drafts = [{ a: 1 }, { a: 1 }];
  const docs = db.insert(drafts);

  t.equal(drafts.length, docs.length, 'inserts duplicate drafts');

  t.end();
});

test('[model.insert] if strict, throws duplicate docs', t => {
  const { db } = setup({ strict: true });

  try {
    db.insert([...data, ...data]);
    t.fail('does not throw');
  } catch (err) {
    t.pass('throws');
  }

  t.end();
});
