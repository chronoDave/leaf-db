const fs = require('fs');

const test = require('tape');

const LeafDB = require('../../build/model').default;

test('[constructor] should create in-memory database when no arguments are provided', t => {
  const db = new LeafDB();

  t.true(db._memory._docs instanceof Map);
  t.strictEqual(db._memory._docs.size, 0);
  t.false(fs.readdirSync(__dirname, { recursive: true }).some(file => file.includes('.txt')));

  t.end();
});
