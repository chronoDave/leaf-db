const fs = require('fs');

const test = require('tape');

const LeafDB = require('../../build/model').default;

test('[constructor] should create in-memory database when no arguments are provided', t => {
  const db = new LeafDB();

  t.true(typeof db._map === 'object');
  t.true(db._list instanceof Set);
  t.strictEqual(Object.keys(db._map).length, 0);
  t.strictEqual(Object.keys(db._list).length, 0);
  t.false(fs.readdirSync(__dirname, { recursive: true }).some(file => file.includes('.txt')));

  t.end();
});
