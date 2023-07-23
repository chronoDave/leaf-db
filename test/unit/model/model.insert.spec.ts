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

test('[model.insert] inserts docs in memory', t => {
  const { db } = setup();

  db.insert(data);
  const docs = db.select({});
  t.true(Array.isArray(docs), 'is array');
  t.strictEqual(docs.length, data.length, 'inserts docs');
  t.deepEqual(docs[0], data[0], 'is doc');

  t.end();
});

test('[model.insert] does not insert duplicate docs', t => {
  const { db } = setup();

  try {
    db.insert([{ _id: '1' }, { _id: '2' }, { _id: '1' }]);
    t.fail('should not insert duplicate docs');
  } catch (err) {
    t.pass('does not insert duplicates docs');
  }

  t.end();
});

test('[model.insert] does not insert docs if any doc is invalid', t => {
  const { db } = setup();

  try {
    db.insert([{ _id: '1' }, { _id: '2' }, { _id: '1' }]);
    t.fail('expected to throw');
  } catch (err) {
    t.equal(db.select({}).length, 0, 'does not insert any docs');
  }

  t.end();
});

test('[model.insert] inserts duplicate drafts', t => {
  const { db } = setup();

  const drafts = [{ a: 1 }, { a: 1 }];
  const docs = db.insert(drafts);

  t.equal(drafts.length, docs.length, 'inserts duplicate drafts');

  t.end();
});
