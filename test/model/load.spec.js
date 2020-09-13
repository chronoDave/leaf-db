const test = require('tape');
const fse = require('fs-extra');

const {
  setup,
  invalidPersistent
} = require('../_utils');

test('[load] should parse valid persistent data', t => {
  const data = [{ _id: 1 }, { _id: 2 }];

  const { db, file } = setup({ data, root: __dirname });

  const corrupted = db.load();

  t.ok(typeof db.data === 'object');
  t.equal(Object.keys(db.data).length, data.length);
  t.equal(corrupted.length, 0);

  for (let i = 0; i < data.length; i += 1) {
    t.deepEqual(Object.values(db.data)[i], data[i]);
  }

  fse.removeSync(file);

  t.end();
});

test('[load] should parse empty file', t => {
  const data = [];

  const { db, file } = setup({ data, root: __dirname });

  const corrupted = db.load();

  t.ok(typeof db.data === 'object');
  t.equal(corrupted.length, 0);
  t.equal(Object.keys(db.data).length, 0);

  fse.removeSync(file);

  t.end();
});

test('[load] should ignore corrupted data', t => {
  const valid = { _id: 2, valid: true };
  const data = [valid, ...invalidPersistent];

  const { db, file } = setup({ data, strict: false, root: __dirname });

  const corrupted = db.load();

  t.ok(typeof db.data === 'object');
  t.equal(corrupted.length, invalidPersistent.length);
  t.equal(Object.keys(db.data).length, 1);

  fse.removeSync(file);

  t.end();
});

test('[load] should throw on corrupt data if strict is enabled', t => {
  const valid = { _id: 2, valid: true };
  const data = [valid, ...invalidPersistent];

  const { file, db } = setup({ data, strict: true, root: __dirname });

  try {
    db.load();
    t.fail('expected to throw');
  } catch (err) {
    t.pass();
  }

  fse.removeSync(file);

  t.end();
});
