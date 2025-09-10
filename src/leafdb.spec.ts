import fsp from 'fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';

import LeafDB from './leafdb.ts';
import struct, { invalid } from './leafdb.struct.ts';

test('[leafdb.open]', async t => {
  await t.test('should not throw if storage is not available', async () => {
    const db = new LeafDB();

    await assert.doesNotReject(async () => db.open());
  });

  await t.test('should not throw if data contains backslash', async () => {
    const { db, cleanup } = await struct([{ invalid: '\\' }]);

    await assert.doesNotReject(async () => db.open());
    await db.close();

    await cleanup();
  });

  await t.test('should not throw if data contains quotation mark', async () => {
    const { db, cleanup } = await struct([{ invalid: '"' }]);

    await assert.doesNotReject(async () => db.open());
    await db.close();

    await cleanup();
  });

  await t.test('should not throw if data contains empty lines', async () => {
    const { db, cleanup } = await struct(['', '', '']);

    await assert.doesNotReject(async () => db.open());
    await db.close();

    await cleanup();
  });

  await t.test('parses valid data', async () => {
    const data = [{ _id: '1' }, { _id: '2' }];
    const { db, cleanup } = await struct(data);

    const corrupt = await db.open();
    const docs = db.select();
    await db.close();

    assert.equal(corrupt.length, 0, 'validates');
    assert.strictEqual(docs.length, data.length, 'sets memory');
    assert.deepEqual(docs, data, 'parses docs');

    await cleanup();
  });

  await t.test('parses empty file', async () => {
    const { db, cleanup } = await struct([]);

    const corrupt = await db.open();
    const docs = db.select();
    await db.close();

    assert.strictEqual(corrupt.length, 0, 'validates');
    assert.strictEqual(docs.length, 0, 'does not parse empty file');

    await cleanup();
  });

  await t.test('ignores corrupted data', async () => {
    const valid = { _id: '2', valid: true };
    const { db, file, cleanup } = await struct([valid, ...invalid]);

    const corrupt = await db.open();
    const docs = db.select();
    await db.close();

    const raw = (await fsp.readFile(file, 'utf-8')).trim().split('\n');

    assert.strictEqual(corrupt.length, invalid.length, 'validates');
    assert.strictEqual(docs.length, 1, 'ignores corrupted data');
    assert.equal(raw.length, 1, 'removes corrupted data');

    await cleanup();
  });

  await t.test('ignores deleted data', async () => {
    const { db, file, cleanup } = await struct([{ _id: '1' }, { _id: '1', __deleted: true }]);

    const corrupt = await db.open();
    const docs = db.select();
    await db.close();

    const raw = (await fsp.readFile(file, 'utf-8')).trim();

    assert.strictEqual(corrupt.length, 0, 'ignores deleted data');
    assert.equal(docs.length, 0, 'ignores deleted data');
    assert.equal(raw.length, 0, 'removes deleted data');

    await db.close();
    await cleanup();
  });
});

test('[leafdb.insert]', async t => {
  await t.test('inserts docs', async () => {
    const db = new LeafDB();

    const docs = await db.insert([{ name: 'test' }]);
    assert.ok(Array.isArray(docs), 'is array');
    assert.equal(docs.length, 1, 'returns docs');
    assert.equal(db.select().length, 1, 'inserts docs');

    const { _id, ...doc } = docs[0];
    assert.ok(_id, 'has id');
    assert.deepEqual(doc, { name: 'test' }, 'has doc');
  });

  await t.test('does not insert duplicate docs', async () => {
    const db = new LeafDB();

    const docs = await db.insert([{ _id: '1' }, { _id: '2' }, { _id: '1' }]);
    assert.equal(docs.length, 2, 'returns docs');
    assert.equal(db.select().length, 2, 'inserts docs');
  });

  await t.test('inserts duplicate drafts', async () => {
    const db = new LeafDB();

    const docs = await db.insert([{ a: 1 }, { a: 1 }]);
    assert.equal(docs.length, 2, 'returns docs');
    assert.equal(db.select().length, 2, 'inserts docs');
  });
});

test('[leafdb.select] returns docs', async () => {
  const db = new LeafDB();
  await db.insert([{ _id: '1' }, { _id: '2' }, { _id: '3' }]);

  assert.strictEqual(db.select().length, 3, 'no ids');
  assert.strictEqual(db.select('1', '2').length, 2, 'valid ids');
  assert.strictEqual(db.select('1', '4').length, 1, 'any id');
});

test('[leafdb.query] returns docs', async () => {
  const db = new LeafDB();
  await db.insert([
    { _id: '1', name: 'test', coordinates: { x: 10, y: 20 } },
    { _id: '2', name: 'query', coordinates: { x: 1, y: 2 } }
  ]);

  assert.strictEqual(db.query().length, 2, 'no query');
  assert.strictEqual(db.query({}).length, 2, 'empty query');
  assert.strictEqual(db.query({ name: 'test' }).length, 1, 'simple query');
  assert.strictEqual(db.query({ coordinates: { x: 10 } }).length, 1, 'nested query');
  assert.strictEqual(db.query({ coordinates: { y: { $lte: 20 } } }).length, 2, 'complex query');

  assert.strictEqual(db.query({ name: 'unknown' }).length, 0, 'no match');
  assert.strictEqual(db.query({ name: 'unknown' }, { name: 'query' }).length, 1, 'any match');
});

test('[leafdb.update]', async t => {
  await t.test('throws if update contains invalid properties', async () => {
    const db = new LeafDB();

    await assert.rejects(async () => db.update({ _id: '1' }, {}), '_id');
    await assert.rejects(async () => db.update({ __deleted: true }, {}), '_id');
  });

  await t.test('does not remove existing keys', async () => {
    const data = [
      { _id: '1', name: 'test', coordinates: { x: 10, y: 20 } },
      { _id: '2', name: 'query', coordinates: { x: 1, y: 2 } }
    ];
    const db = new LeafDB();
    await db.insert(data);

    const docs = await db.update({}, {});
    assert.equal(docs.length, 2, 'replaces all docs');
    assert.deepEqual(docs[0], data[0], 'does not remove existing keys');
  });

  await t.test('updates existing keys', async () => {
    const db = new LeafDB<{ name: string; coordinates: { x: number; y: number } }>();
    await db.insert([
      { _id: '1', name: 'test', coordinates: { x: 10, y: 20 } },
      { _id: '2', name: 'query', coordinates: { x: 1, y: 2 } }
    ]);

    const docs = await db.update({ coordinates: { x: 5 } }, {});
    assert.equal(docs[1].coordinates.x, 5, 'sets existing key');
  });
});

test('[leafdb.delete] deletes documents', async () => {
  const { db, file, cleanup } = await struct([{ _id: '1' }, { _id: '2' }]);

  await db.open();
  const n = await db.delete('1', '2');
  assert.equal(n, 2, 'returns deleted count');

  const docs = db.query();
  assert.equal(docs.length, 0, 'deletes in memory');

  await db.close();

  const raw = (await fsp.readFile(file, 'utf-8'))
    .trim()
    .split('\n')
    .map(x => JSON.parse(x));
  assert.equal(raw.length, 4, 'writes deletes');
  assert.equal(raw.filter(x => x.__deleted).length, 2, 'has deletes');

  await cleanup();
});

test('[leafdb.drop] deletes all documents', async () => {
  const { db, file, cleanup } = await struct([{ _id: '1' }, { _id: '2' }]);

  await db.drop();

  const docs = db.query();
  assert.equal(docs.length, 0, 'deletes in memory');

  await db.close();

  const raw = (await fsp.readFile(file, 'utf-8')).trim();
  assert.equal(raw.length, 0, 'deletes file');

  await cleanup();
});

test('[leafdb.close] closes file', async () => {
  const { db, file, cleanup } = await struct([{ _id: '1' }, { _id: '2' }]);

  await db.open();
  await db.close();

  await assert.doesNotReject(async () => fsp.readFile(file), 'releases file');

  await cleanup();
});
