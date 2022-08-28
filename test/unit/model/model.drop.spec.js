const fs = require('fs');
const test = require('tape');

const { setup, mockMemory } = require('../_utils');

test('[model.drop] drops data', async t => {
  const { db } = setup({ memory: mockMemory });

  db.drop();

  t.strictEqual(db._memory._docs.size, 0, 'clears memory');

  t.end();
});

test('[model.drop] drops data and persists', t => {
  const { db, file } = setup({ memory: mockMemory, root: __dirname });

  db.open();
  db.drop();
  db.close();

  t.strictEqual(db._memory._docs.size, 0, 'clears memory');
  t.strictEqual(fs.readFileSync(file, 'utf-8'), '', 'clears file');

  t.end();
});
