const fs = require('fs');

const test = require('tape');

const { setup, invalidPersistent } = require('../_utils');

test('[load] should not throw if data contains backslash', async t => {
  const { db, file } = setup({
    data: [{ invalid: '\\' }],
    root: __dirname
  });

  try {
    await db.load();
    t.pass('does not throw');
  } catch (err) {
    t.fail(err);
  }

  db.close();
  fs.unlinkSync(file);

  t.end();
});

test('[load] show not throw if data contains quotation mark', async t => {
  const { db, file } = setup({
    data: [{ invalid: '"' }],
    root: __dirname
  });

  try {
    await db.load();
    t.pass('does not throw');
  } catch (err) {
    t.fail(err);
  }

  db.close();
  fs.unlinkSync(file);

  t.end();
});

test('[load] should parse valid persistent data', async t => {
  const data = [{ _id: '1' }, { _id: '2' }];
  const { db, file } = setup({
    data,
    root: __dirname
  });

  const corrupted = await db.load();
  db.close();

  t.true(typeof db._memory._docs === 'object');
  t.strictEqual(db._memory._docs.size, data.length);
  t.strictEqual(corrupted.length, 0);

  for (let i = 0; i < data.length; i += 1) {
    t.deepEqual(db._memory._docs.get(data[i]._id), data[i]);
  }

  fs.unlinkSync(file);

  t.end();
});

test('[load] should parse empty file', async t => {
  const data = [];
  const { db, file } = setup({ data, root: __dirname });

  const corrupted = await db.load();
  db.close();

  t.true(typeof db._memory._docs === 'object');
  t.strictEqual(corrupted.length, 0);
  t.strictEqual(db._memory._docs.size, 0);

  fs.unlinkSync(file);

  t.end();
});

test('[load] should ignore corrupted data', async t => {
  const valid = { _id: '2', valid: true };
  const data = [valid, ...invalidPersistent];

  const { db, file } = setup({ data, root: __dirname });

  const corrupted = await db.load();
  db.close();

  t.true(typeof db._memory._docs === 'object');
  t.strictEqual(corrupted.length, invalidPersistent.length);
  t.strictEqual(db._memory._docs.size, 1);

  fs.unlinkSync(file);

  t.end();
});

test('[load] should ignore deleted data', async t => {
  const data = [{ _id: '2' }, { _id: '3', __deleted: true }];

  const { db, file } = setup({ data, root: __dirname });

  const corrupted = await db.load();
  db.close();

  t.strictEqual(corrupted.length, 0);
  t.strictEqual(db._memory._docs.size, 1);

  fs.unlinkSync(file);

  t.end();
});

test('[load] should throw on corrupt data if strict is enabled', async t => {
  const valid = { _id: '2', valid: true };
  const data = [valid, ...invalidPersistent];

  const { temp, file, db } = setup({
    data,
    root: __dirname
  });

  try {
    await db.load(true);
    t.fail('expected to throw');
  } catch (err) {
    t.pass('throws');
  }

  db.close();
  fs.unlinkSync(temp);
  fs.unlinkSync(file);

  t.end();
});
