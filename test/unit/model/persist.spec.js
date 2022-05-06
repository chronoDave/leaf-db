const fs = require('fs');

const test = require('tape');

const { setup } = require('../_utils');

test('[persist] should throw error if called memory mode', t => {
  const { db } = setup();

  try {
    db.persist(true);
    t.fail('expected to throw');
  } catch (err) {
    t.pass('throws');
  }

  t.end();
});

test('[persist] should persist data', t => {
  const { db, file } = setup({ root: __dirname });

  db._store._map.set(1, { _id: 1 });
  db._store._map.set(2, { _id: 2 });
  db._store._map.set(3, { _id: 3 });
  db.persist();

  const data = fs.readFileSync(file, 'utf-8');

  t.strictEqual(db._store.keys().length, data.split('\n').length);

  fs.unlinkSync(file);

  t.end();
});

test('[persist] should throw if data contains corrupt data', t => {
  const { db, file } = setup({ strict: true, root: __dirname });

  db._store._map.set(1, { _id: 1, $deleted: true });
  db._store._map.set(2, { _id: 2 });
  db._store._map.set(3, null);

  try {
    db.persist(true);
    t.fail('expected to throw');
    fs.unlinkSync(file);
  } catch (err) {
    t.pass('throws');
  }

  t.end();
});
