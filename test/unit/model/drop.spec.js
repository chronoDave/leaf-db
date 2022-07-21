const fs = require('fs');
const test = require('tape');

const { setup, mockMemory } = require('../_utils');

test('[drop] should drop data', async t => {
  const { db } = setup({ memory: mockMemory });

  db.drop();
  t.strictEqual(db._memory._docs.size, 0);

  t.end();
});

test('[drop] should drop data and persist if not in memory mode', async t => {
  const { db, file } = setup({ memory: mockMemory, root: __dirname });

  await db.open();
  db.drop();
  db.close();
  t.strictEqual(db._memory._docs.size, 0);

  const fileData = fs.readFileSync(file, 'utf-8').split('\n');
  t.strictEqual(fileData.length, 1);

  t.end();
});
