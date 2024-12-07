import fs from 'fs';
import test from 'tape';

import setup, { invalid } from './fixture';
// const { setup, invalidPersistent } = require('../_utils');

test('[model.open] should not throw if data contains backslash', t => {
  const { db, file } = setup({
    data: [{ invalid: '\\' }],
    root: __dirname
  });

  try {
    db.open();
    t.pass('does not throw');
  } catch (err) {
    t.fail((err as Error).message);
  }

  db.close();
  fs.unlinkSync(file);

  t.end();
});

test('[model.open] should not throw if data contains quotation mark', t => {
  const { db, file } = setup({
    data: [{ invalid: '"' }],
    root: __dirname
  });

  try {
    db.open();
    t.pass('does not throw');
  } catch (err) {
    t.fail((err as Error).message);
  }

  db.close();
  fs.unlinkSync(file);

  t.end();
});

test('[model.open] parses valid persistent data', t => {
  const data = [{ _id: '1' }, { _id: '2' }];
  const { db, file } = setup({
    data,
    root: __dirname
  });

  const corrupted = db.open();
  db.close();

  // @ts-expect-error: Access private
  t.strictEqual(db._memory._docs.size, data.length, 'inserts docs');
  t.strictEqual(corrupted.length, 0, 'validates');
  for (let i = 0; i < data.length; i += 1) {
    // @ts-expect-error: Access private
    t.deepEqual(db._memory._docs.get(data[i]._id), data[i], 'parses docs');
  }

  fs.unlinkSync(file);

  t.end();
});

test('[model.open] parses empty file', t => {
  const data: any[] = [];
  const { db, file } = setup({ data, root: __dirname });

  const corrupted = db.open();
  db.close();

  t.strictEqual(corrupted.length, 0, 'validates');
  // @ts-expect-error: Access private
  t.strictEqual(db._memory._docs.size, 0, 'does not parse empty file');

  fs.unlinkSync(file);

  t.end();
});

test('[model.open] ignores corrupted data', t => {
  const valid = { _id: '2', valid: true };
  const data = [valid, ...invalid];

  const { db, file } = setup({ data, root: __dirname });

  const corrupted = db.open();
  db.close();

  t.strictEqual(corrupted.length, invalid.length, 'validates');
  // @ts-expect-error: Access private
  t.strictEqual(db._memory._docs.size, 1, 'ignores invalid data');

  fs.unlinkSync(file);

  t.end();
});

test('[model.open] ignores deleted data', t => {
  const { db, file } = setup<{ data: string }>({ root: __dirname });

  db.open();
  db.insert([{ data: 'a' }, { data: 'b' }]);
  const docs = db.delete({ data: 'a' }, { data: 'b' });
  t.strictEqual(docs, 2, 'delete docs (any match)');
  db.close();
  db.open();

  t.strictEqual(db.select({}).length, 0, 'ignores deleted data');

  db.close();
  fs.unlinkSync(file);

  t.end();
});

test('[model.open] throws in memory mode', t => {
  const { db } = setup();

  try {
    db.open();
    t.fail('expected to throw');
  } catch (err) {
    t.pass('throws');
  }

  t.end();
});

test('[model.open] can read inserted data', async t => {
  const data = [{ _id: '1' }, { _id: '2' }];

  const { file, db } = setup({ root: __dirname });
  db.open();
  db.insert(data);
  db.close();
  const corrupted = db.open();

  t.equal(corrupted.length, 0, 'reads all data');
  const docs = db.select({});
  t.equal(docs.length, data.length, 'inserts all data');

  db.close();
  fs.unlinkSync(file);

  t.end();
});

test('[model.open] removes invalid data', async t => {
  const data = [{ _id: '1' }, { _id: '2' }, { _id: '3' }];

  const { file, db } = setup({ root: __dirname });
  db.open();
  db.insert(data);
  db.drop();
  db.close();
  const corrupted = db.open();

  t.equal(corrupted.length, 0, 'removes invalid data from file');
  const docs = db.select({});
  t.equal(docs.length, 0, 'removes invalid data from memory');

  db.close();
  fs.unlinkSync(file);

  t.end();
});
