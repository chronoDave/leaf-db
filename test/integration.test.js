const test = require('tape');

const LeafDB = require('..');

test('[integration] should expose LeafDB export', t => {
  try {
    const db = new LeafDB();

    t.notEqual(db, undefined);
    t.true(db._store._map instanceof Map);
  } catch (err) {
    t.fail(err.message);
  }

  t.end();
});
