const test = require('tape');

const LeafDB = require('..');

test('[integration] should expose LeafDB export', t => {
  try {
    const db = new LeafDB();

    t.notEqual(db, undefined);
    t.strictEqual(typeof db._map, 'object');
    t.true(db._list instanceof Set);
  } catch (err) {
    t.fail(err.message);
  }

  t.end();
});
