import fs from 'fs';
import test from 'node:test';
import assert from 'node:assert/strict';

import setup, { invalid } from './fixture.ts';

test('[model.open] should not throw if data contains backslash', () => {
  const { db, file } = setup({
    data: [{ invalid: '\\' }],
    root: import.meta.dirname
  });

  assert.doesNotThrow(() => db.open());

  db.close();
  fs.unlinkSync(file);
});

test('[model.open] should not throw if data contains quotation mark', () => {
  const { db, file } = setup({
    data: [{ invalid: '"' }],
    root: import.meta.dirname
  });

  assert.doesNotThrow(() => db.open());

  db.close();
  fs.unlinkSync(file);
});

test('[model.open] parses valid persistent data', () => {
  const data = [{ _id: '1' }, { _id: '2' }];
  const { db, file } = setup({
    data,
    root: import.meta.dirname
  });

  const corrupted = db.open();
  db.close();

  // @ts-expect-error: Access private
  assert.strictEqual(db._memory._docs.size, data.length, 'inserts docs');
  assert.strictEqual(corrupted.length, 0, 'validates');
  for (let i = 0; i < data.length; i += 1) {
    // @ts-expect-error: Access private
    assert.deepEqual(db._memory._docs.get(data[i]._id), data[i], 'parses docs');
  }

  fs.unlinkSync(file);
});

test('[model.open] parses empty file', () => {
  const data: any[] = [];
  const { db, file } = setup({ data, root: import.meta.dirname });

  const corrupted = db.open();
  db.close();

  assert.strictEqual(corrupted.length, 0, 'validates');
  // @ts-expect-error: Access private
  assert.strictEqual(db._memory._docs.size, 0, 'does not parse empty file');

  fs.unlinkSync(file);
});

test('[model.open] ignores corrupted data', () => {
  const valid = { _id: '2', valid: true };
  const data = [valid, ...invalid];

  const { db, file } = setup({ data, root: import.meta.dirname });

  const corrupted = db.open();
  db.close();

  assert.strictEqual(corrupted.length, invalid.length, 'validates');
  // @ts-expect-error: Access private
  assert.strictEqual(db._memory._docs.size, 1, 'ignores invalid data');

  fs.unlinkSync(file);
});

test('[model.open] ignores deleted data', () => {
  const { db, file } = setup<{ data: string }>({ root: import.meta.dirname });

  db.open();
  db.insert([{ data: 'a' }, { data: 'b' }]);
  const docs = db.delete({ data: 'a' }, { data: 'b' });
  assert.strictEqual(docs, 2, 'delete docs (any match)');
  db.close();
  db.open();

  assert.strictEqual(db.select({}).length, 0, 'ignores deleted data');

  db.close();
  fs.unlinkSync(file);
});

test('[model.open] throws in memory mode', () => {
  const { db } = setup();

  assert.throws(() => db.open());
});

test('[model.open] can read inserted data', () => {
  const data = [{ _id: '1' }, { _id: '2' }];

  const { file, db } = setup({ root: import.meta.dirname });
  db.open();
  db.insert(data);
  db.close();
  const corrupted = db.open();

  assert.equal(corrupted.length, 0, 'reads all data');
  const docs = db.select({});
  assert.equal(docs.length, data.length, 'inserts all data');

  db.close();
  fs.unlinkSync(file);
});

test('[model.open] removes invalid data', () => {
  const data = [{ _id: '1' }, { _id: '2' }, { _id: '3' }];

  const { file, db } = setup({ root: import.meta.dirname });
  db.open();
  db.insert(data);
  db.drop();
  db.close();
  const corrupted = db.open();

  assert.equal(corrupted.length, 0, 'removes invalid data from file');
  const docs = db.select({});
  assert.equal(docs.length, 0, 'removes invalid data from memory');

  db.close();
  fs.unlinkSync(file);
});
