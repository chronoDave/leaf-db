const fs = require('fs');

const test = require('tape');

const { setup, mockMemory } = require('../_utils');

test('[drop] should drop data', async t => {
  const { db } = setup({ memory: mockMemory });

  await db.drop();

  t.equal(Object.keys(db.data).length, 0);

  t.end();
});

test('[drop] should drop data and persist if not in memory mode', async t => {
  const { db, file } = setup({ memory: mockMemory, root: __dirname });

  await db.drop();

  t.equal(Object.keys(db.data).length, 0);

  const fileData = fs.readFileSync(file, 'utf-8').split('\n');

  t.equal(fileData.length, 1);
  t.equal(fileData[0], '');

  t.end();
});
