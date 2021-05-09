const test = require('tape');

const LeafDB = require('../dist/leafdb');

test('[integration] should expose LeafDB export', t => {
  try {
    const db = new LeafDB();

    t.notEqual(db, undefined);
    t.strictEqual(typeof db.map, 'object');
    t.true(db.list instanceof Set);
  } catch (err) {
    t.fail(err.message);
  }

  t.end();
});
