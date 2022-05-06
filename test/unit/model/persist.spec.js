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

  db._map = {
    1: { _id: 1 },
    2: { _id: 2 },
    3: { _id: 3 }
  };
  db._list = new Set([1, 2, 3]);
  db.persist();

  const data = fs.readFileSync(file, 'utf-8');

  t.strictEqual(Object.keys(db._map).length, data.split('\n').length);

  fs.unlinkSync(file);

  t.end();
});

test('[persist] should throw if data contains corrupt data', t => {
  const { db, file } = setup({ strict: true, root: __dirname });

  db._list = new Set([1, 2, 3]);
  db._map = {
    1: { _id: 1, $deleted: true },
    2: { _id: 2 },
    3: null
  };

  try {
    db.persist(true);
    t.fail('expected to throw');
    fs.unlinkSync(file);
  } catch (err) {
    t.pass('throws');
  }

  t.end();
});
