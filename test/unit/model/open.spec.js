const fs = require('fs');
const test = require('tape');

const { setup, invalidPersistent } = require('../_utils');

test('[open] should not throw if data contains backslash', t => {
  const { db, file } = setup({
    data: [{ invalid: '\\' }],
    root: __dirname
  });

  try {
    db.open();
    t.pass('does not throw');
  } catch (err) {
    t.fail(err);
  }

  db.close();
  fs.unlinkSync(file);

  t.end();
});

test('[open] show not throw if data contains quotation mark', t => {
  const { db, file } = setup({
    data: [{ invalid: '"' }],
    root: __dirname
  });

  try {
    db.open();
    t.pass('does not throw');
  } catch (err) {
    t.fail(err);
  }

  db.close();
  fs.unlinkSync(file);

  t.end();
});

test('[open] should parse valid persistent data', t => {
  const data = [{ _id: '1' }, { _id: '2' }];
  const { db, file } = setup({
    data,
    root: __dirname
  });

  const corrupted = db.open();
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

test('[open] should parse empty file', t => {
  const data = [];
  const { db, file } = setup({ data, root: __dirname });

  const corrupted = db.open();
  db.close();

  t.true(typeof db._memory._docs === 'object');
  t.strictEqual(corrupted.length, 0);
  t.strictEqual(db._memory._docs.size, 0);

  fs.unlinkSync(file);

  t.end();
});

test('[open] should ignore corrupted data', t => {
  const valid = { _id: '2', valid: true };
  const data = [valid, ...invalidPersistent];

  const { db, file } = setup({ data, root: __dirname });

  const corrupted = db.open();
  db.close();

  t.true(typeof db._memory._docs === 'object');
  t.strictEqual(corrupted.length, invalidPersistent.length);
  t.strictEqual(db._memory._docs.size, 1);

  fs.unlinkSync(file);

  t.end();
});

test('[open] should ignore deleted data', t => {
  const data = [{ _id: '2' }, { _id: '3', __deleted: true }];

  const { db, file } = setup({ data, root: __dirname });

  const corrupted = db.open();
  db.close();

  t.strictEqual(corrupted.length, 0);
  t.strictEqual(db._memory._docs.size, 1);

  fs.unlinkSync(file);

  t.end();
});

test('[open] should throw on corrupt data if strict is enabled', t => {
  const valid = { _id: '2', valid: true };
  const data = [valid, ...invalidPersistent];

  const { file, db } = setup({
    data,
    root: __dirname
  });

  try {
    db.open({ strict: true });
    t.fail('expected to throw');
  } catch (err) {
    t.pass('throws');
  }

  db.close();
  fs.unlinkSync(file);

  t.end();
});
