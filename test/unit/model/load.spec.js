const fs = require('fs');

const test = require('tape');

const { setup, invalidPersistent } = require('../_utils');

test('[load] should not throw if data contains backslash', t => {
  const { db, file } = setup({
    data: [{ invalid: '\\' }],
    disableAutoload: true,
    root: __dirname
  });

  db.load();

  fs.unlinkSync(file);

  t.end();
});

test('[load] show not throw if data contains quotation mark', t => {
  const { db, file } = setup({
    data: [{ invalid: '"' }],
    disableAutoload: true,
    root: __dirname
  });

  db.load();

  fs.unlinkSync(file);

  t.end();
});

test('[load] should parse valid persistent data', t => {
  const data = [{ _id: 1 }, { _id: 2 }];

  const { db, file } = setup({
    data,
    disableAutoload: true,
    root: __dirname
  });

  const corrupted = db.load();

  t.true(typeof db.map === 'object');
  t.strictEqual(Object.keys(db.map).length, data.length);
  t.strictEqual(db.list.size, data.length);
  t.strictEqual(corrupted.length, 0);

  for (let i = 0; i < data.length; i += 1) {
    t.deepEqual(Object.values(db.map)[i], data[i]);
  }

  fs.unlinkSync(file);

  t.end();
});

test('[load] should parse empty file', t => {
  const data = [];

  const { db, file } = setup({ data, disableAutoload: true, root: __dirname });

  const corrupted = db.load();

  t.true(typeof db.map === 'object');
  t.strictEqual(corrupted.length, 0);
  t.strictEqual(Object.keys(db.map).length, 0);
  t.strictEqual(db.list.size, 0);

  fs.unlinkSync(file);

  t.end();
});

test('[load] should ignore corrupted data', t => {
  const valid = { _id: 2, valid: true };
  const data = [valid, ...invalidPersistent];

  const { db, file } = setup({ data, disableAutoload: true, root: __dirname });

  const corrupted = db.load();

  t.true(typeof db.map === 'object');
  t.strictEqual(corrupted.length, invalidPersistent.length);
  t.strictEqual(Object.keys(db.map).length, 1);
  t.strictEqual(db.list.size, 1);

  fs.unlinkSync(file);

  t.end();
});

test('[load] should throw on corrupt data if strict is enabled', t => {
  const valid = { _id: 2, valid: true };
  const data = [valid, ...invalidPersistent];

  const { file, db } = setup({
    data,
    strict: true,
    disableAutoload: true,
    root: __dirname
  });

  try {
    db.load();
    t.fail('expected to throw');
  } catch (err) {
    t.pass('throws');
  }

  fs.unlinkSync(file);

  t.end();
});
