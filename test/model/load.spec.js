const fs = require('fs');

const test = require('tape');

const { setup, invalidPersistent } = require('../_utils');

test('[load] should not throw if data contains backslash', t => {
  const { db, file } = setup({
    data: [{ invalid: '\\' }],
    autoload: false,
    root: __dirname
  });

  db.load();

  fs.unlinkSync(file);

  t.end();
});

test('[load] show not throw if data contains quotation mark', t => {
  const { db, file } = setup({
    data: [{ invalid: '"' }],
    autoload: false,
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
    autoload: false,
    root: __dirname
  });

  const corrupted = db.load();

  t.true(typeof db.data === 'object');
  t.equal(Object.keys(db.data).length, data.length);
  t.equal(corrupted.length, 0);

  for (let i = 0; i < data.length; i += 1) {
    t.deepEqual(Object.values(db.data)[i], data[i]);
  }

  fs.unlinkSync(file);

  t.end();
});

test('[load] should parse empty file', t => {
  const data = [];

  const { db, file } = setup({ data, autoload: false, root: __dirname });

  const corrupted = db.load();

  t.true(typeof db.data === 'object');
  t.equal(corrupted.length, 0);
  t.equal(Object.keys(db.data).length, 0);

  fs.unlinkSync(file);

  t.end();
});

test('[load] should ignore corrupted data', t => {
  const valid = { _id: 2, valid: true };
  const data = [valid, ...invalidPersistent];

  const { db, file } = setup({ data, autoload: false, root: __dirname });

  const corrupted = db.load();

  t.true(typeof db.data === 'object');
  t.equal(corrupted.length, invalidPersistent.length);
  t.equal(Object.keys(db.data).length, 1);

  fs.unlinkSync(file);

  t.end();
});

test('[load] should throw on corrupt data if strict is enabled', t => {
  const valid = { _id: 2, valid: true };
  const data = [valid, ...invalidPersistent];

  const { file, db } = setup({
    data,
    strict: true,
    autoload: false,
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
