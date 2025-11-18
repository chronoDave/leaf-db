import fsp from 'fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';

import LeafDB from './leafdb.ts';
import struct, { invalid, options } from './leafdb.struct.ts';

test('[leafdb.id] generates unique ids', () => {
  const length = 10000;

  assert.equal(
    new Set(Array.from({ length }).map(() => LeafDB.id())).size,
    length
  );
});

test('[leafdb.docs] returns all docs', async () => {
  const db = new LeafDB();
  const length = 10;

  await Promise.all(Array.from({ length }).map(async () => db.insert({})));

  assert.equal(db.docs.length, length);
});

test('[leafdb.open]', async t => {
  await t.test('should not throw if storage is not available', async () => {
    const db = new LeafDB();

    await assert.doesNotReject(async () => db.open(options));
  });

  await t.test('should not throw if data contains backslash', async () => {
    const { db, cleanup } = await struct([{ invalid: '\\' }]);

    await assert.doesNotReject(async () => db.open(options));
    await db.close();

    await cleanup();
  });

  await t.test('should not throw if data contains quotation mark', async () => {
    const { db, cleanup } = await struct([{ invalid: '"' }]);

    await assert.doesNotReject(async () => db.open(options));
    await db.close();

    await cleanup();
  });

  await t.test('should not throw if data contains empty lines', async () => {
    const { db, cleanup } = await struct(['', '', '']);

    await assert.doesNotReject(async () => db.open(options));
    await db.close();

    await cleanup();
  });

  await t.test('parses valid data', async () => {
    const data = [{ _id: '1' }, { _id: '2' }];
    const { db, cleanup } = await struct(data);

    const corrupt = await db.open(options);
    await db.close();

    assert.equal(corrupt.length, 0, 'validates');
    assert.strictEqual(db.docs.length, data.length, 'sets memory');
    assert.deepEqual(db.docs, data, 'parses docs');

    await cleanup();
  });

  await t.test('parses empty file', async () => {
    const { db, cleanup } = await struct([]);

    const corrupt = await db.open(options);
    await db.close();

    assert.strictEqual(corrupt.length, 0, 'validates');
    assert.strictEqual(db.docs.length, 0, 'does not parse empty file');

    await cleanup();
  });

  await t.test('ignores corrupted data', async () => {
    const valid = { _id: '2', valid: true };
    const { db, file, cleanup } = await struct([valid, ...invalid]);

    const corrupt = await db.open(options);
    await db.close();

    const raw = (await fsp.readFile(file, 'utf-8')).trim().split('\n');

    assert.strictEqual(corrupt.length, invalid.length, 'validates');
    assert.strictEqual(db.docs.length, 1, 'ignores corrupted data');
    assert.equal(raw.length, 1, 'removes corrupted data');

    await cleanup();
  });

  await t.test('ignores deleted data', async () => {
    const { db, file, cleanup } = await struct([{ _id: '1' }, { _id: '1', __deleted: true }]);

    const corrupt = await db.open(options);
    await db.close();

    const raw = (await fsp.readFile(file, 'utf-8')).trim().split('\n');

    assert.strictEqual(corrupt.length, 0, 'ignores deleted data');
    assert.equal(db.docs.length, 0, 'ignores deleted data');
    assert.equal(raw.length, 1, 'removes deleted data');

    await db.close();
    await cleanup();
  });
});

test('[leafdb.close] closes file', async () => {
  const { db, file, cleanup } = await struct([{ _id: '1' }, { _id: '2' }]);

  await db.open(options);
  await db.close();

  await assert.doesNotReject(async () => fsp.readFile(file), 'releases file');

  await cleanup();
});

test('[leafdb.get] returns docs', async () => {
  const db = new LeafDB();
  const data = [{ _id: '1' }, { _id: '2' }, { _id: '3' }];

  await Promise.all(data.map(async x => db.insert(x)));

  assert.strictEqual(db.docs.length, 3, 'no ids');
  assert.strictEqual(['1', '2'].map(id => db.get(id)).length, 2, 'valid ids');
  assert.strictEqual(['1', '4'].map(id => db.get(id)).filter(x => x).length, 1, 'any id');
});

test('[leafdb.insert]', async t => {
  await t.test('throws if doc already exists duplicate drafts', async () => {
    const db = new LeafDB();
    
    await db.insert({ _id: '1' });
    await assert.rejects(async () => db.insert({ _id: '1' }));
  });

  await t.test('inserts docs', async () => {
    const db = new LeafDB<{ name: string }>();

    const doc = await db.insert({ name: 'test' });

    assert.equal(db.docs.length, 1, 'inserts docs');
    assert.ok(typeof doc._id === 'string', 'has id');
    assert.deepEqual(doc.name, 'test', 'has doc');
  });
});

test('[leafdb.query] returns docs', async () => {
  const db = new LeafDB<{ name: string; coordinates: { x: number; y: number } }>();
  const data = [
    { _id: '1', name: 'test', coordinates: { x: 10, y: 20 } },
    { _id: '2', name: 'query', coordinates: { x: 1, y: 2 } }
  ];

  await Promise.all(data.map(async x => db.insert(x)));
  
  assert.strictEqual(db.query({ name: 'test' }).length, 1, 'simple query');
  assert.strictEqual(db.query({ coordinates: { x: 10 } }).length, 1, 'nested query');
  assert.strictEqual(db.query({ coordinates: { y: { $lte: 20 } } }).length, 2, 'complex query');

  assert.strictEqual(db.query({ name: 'unknown' }).length, 0, 'no match');
  assert.strictEqual(db.query({ $or: [{ name: 'unknown' }, { name: 'query' }] }).length, 1, 'or match');
  assert.strictEqual(db.query({ $and: [{ coordinates: { x: 10 } }, { coordinates: { y: 20 } }] }).length, 1, 'and match');
});

test('[leafdb.update]', async t => {
  await t.test('throws if document does not exist', async () => {
    const db = new LeafDB();

    await assert.rejects(async () => db.update({ _id: 'a' }));
  });

  await t.test('updates doc', async () => {
    const db = new LeafDB();

    const doc = { _id: 'a', name: 'a' };

    await db.insert(doc);
    doc.name = 'b';
    await db.update(doc);

    assert.equal(db.get('a')?.name, 'b');
  });
});

test('[leafdb.delete] deletes documents', async () => {
  const { db, file, cleanup } = await struct([{ _id: '1' }, { _id: '2' }]);

  await db.open(options);
  await db.delete('1');

  assert.equal(db.docs.length, 1, 'deletes in memory');

  await db.close();

  const raw = await fsp.readFile(file, 'utf-8');
  const docs = raw
    .trim()
    .split('\n')
    .map(x => JSON.parse(x));
  assert.equal(docs.length, 3, 'writes deletes');
  assert.equal(docs.filter(x => x.__deleted).length, 1, 'has deletes');

  await cleanup();
});

test('[leafdb.drop] deletes all documents', async () => {
  const { db, file, cleanup } = await struct([{ _id: '1' }, { _id: '2' }]);

  await db.open(options);
  await db.drop();

  assert.equal(db.docs.length, 0, 'deletes in memory');

  await db.close();

  const raw = (await fsp.readFile(file, 'utf-8')).trim();
  assert.equal(raw.length, 0, 'deletes file');

  await cleanup();
});
