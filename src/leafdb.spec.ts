import type { Doc } from './fixture.ts';

import fs from 'fs';
import test from 'node:test';
import assert from 'node:assert/strict';

import setup, { data, invalid, memory } from './leafdb.struct.ts';

test('[leafdb.open]', async t => {
  await t.test('should not throw if data contains backslash', () => {
    const { db, file } = setup({
      data: [{ invalid: '\\' }],
      root: import.meta.dirname
    });

    assert.doesNotThrow(() => db.open());

    db.close();
    fs.unlinkSync(file);
  });

  await t.test('should not throw if data contains quotation mark', () => {
    const { db, file } = setup({
      data: [{ invalid: '"' }],
      root: import.meta.dirname
    });

    assert.doesNotThrow(() => db.open());

    db.close();
    fs.unlinkSync(file);
  });

  await t.test('parses valid persistent data', () => {
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

  await t.test('parses empty file', () => {
    const data: any[] = [];
    const { db, file } = setup({ data, root: import.meta.dirname });

    const corrupted = db.open();
    db.close();

    assert.strictEqual(corrupted.length, 0, 'validates');
    // @ts-expect-error: Access private
    assert.strictEqual(db._memory._docs.size, 0, 'does not parse empty file');

    fs.unlinkSync(file);
  });

  await t.test('ignores corrupted data', () => {
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

  await t.test('ignores deleted data', () => {
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

  await t.test('throws in memory mode', () => {
    const { db } = setup();

    assert.throws(() => db.open());
  });

  await t.test('can read inserted data', () => {
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

  await t.test('removes invalid data', () => {
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
});

test('[leafdb.insert]', async t => {
  await t.test('inserts docs', () => {
    const { db } = setup();

    const docs = db.insert(data);
    assert.ok(Array.isArray(docs), 'is array');
    assert.strictEqual(docs.length, data.length, 'inserts docs');
    assert.deepEqual(docs[0], data[0], 'is doc');
  });

  await t.test('inserts docs in memory', () => {
    const { db } = setup();

    db.insert(data);
    const docs = db.select({});
    assert.ok(Array.isArray(docs), 'is array');
    assert.strictEqual(docs.length, data.length, 'inserts docs');
    assert.deepEqual(docs[0], data[0], 'is doc');
  });

  await t.test('does not insert duplicate docs', () => {
    const { db } = setup();

    assert.throws(() => db.insert([{ _id: '1' }, { _id: '2' }, { _id: '1' }]));
  });

  await t.test('does not insert docs if any doc is invalid', () => {
    const { db } = setup();

    assert.throws(() => db.insert([{ _id: '1' }, { _id: '2' }, { _id: '1' }]));
  });

  await t.test('inserts duplicate drafts', () => {
    const { db } = setup();

    const drafts = [{ a: 1 }, { a: 1 }];
    const docs = db.insert(drafts);

    assert.equal(drafts.length, docs.length, 'inserts duplicate drafts');
  });
});

test('[leafdb.select]', async t => {
  await t.test('returns docs on empty query', () => {
    const { db } = setup<Doc>({ memory });

    const docs = db.select({});
    assert.ok(Array.isArray(docs), 'is array');
    assert.strictEqual(docs.length, Object.keys(memory).length, 'finds docs (empty)');
  });

  await t.test('returns docs on query match (simple)', () => {
    const { db } = setup<Doc>({ memory });

    const docs = db.select({ nametype: 'Valid' });
    assert.strictEqual(docs.length, 1000, 'finds docs (simple)');
  });

  await t.test('returns docs on query match (nested)', () => {
    const { db } = setup<Doc>({ memory });

    const docs = db.select({ geolocation: { type: 'Point' } });
    assert.strictEqual(docs.length, 988, 'finds docs (nested)');
  });

  await t.test('returns docs on query match (complex)', () => {
    const { db } = setup<Doc>({ memory });

    const docs = db.select({ geolocation: { coordinates: { $has: 56.18333 } } });
    assert.strictEqual(docs.length, 1, 'finds docs (complex)');
  });

  await t.test('returns empty array if query does not match', () => {
    const { db } = setup<Doc>({ memory });

    const docs = db.select({ geolocation: { coordinates: { $has: -1 } } });
    assert.strictEqual(docs.length, 0, 'does not find docs (no match)');
  });

  await t.test('returns docs if any query matches', () => {
    const { db } = setup<Doc>({ memory });

    const docs = db.select(
      { geolocation: { coordinates: { $has: -1 } } },
      { geolocation: { coordinates: { $has: 56.18333 } } }
    );
    assert.strictEqual(docs.length, 1, 'finds docs (any match)');
  });
});

test('[leafdb.selectById]', async t => {
  await t.test('returns docs on empty query', () => {
    const { db } = setup<Doc>({ memory });

    const docs = db.selectById();
    assert.ok(Array.isArray(docs), 'is array');
    assert.strictEqual(docs.length, 0, 'finds docs (empty)');
  });

  await t.test('returns docs on id match', () => {
    const { db } = setup<Doc>({ memory });

    const docs = db.selectById('2', '6');
    assert.strictEqual(docs.length, 2, 'finds docs');
    assert.strictEqual(docs[0].name, 'Aarhus', 'finds correct docs');
  });
});

test('[leafdb.update]', async t => {
  await t.test('replaces docs on empty query', () => {
    const { db } = setup<Doc>({ memory });

    const docs = db.update({}, {});
    assert.ok(Array.isArray(docs), 'is array');
    assert.strictEqual(docs.length, Object.keys(memory).length, 'replaced docs (empty)');
  });

  await t.test('replaces docs if matches are found (simple)', () => {
    const { db } = setup<Doc>({ memory });

    const docs = db.update({}, { recclass: 'H6' });
    assert.strictEqual(docs.length, 77, 'replaced docs (simple');
  });

  await t.test('replaces docs if matches are found (nested)', () => {
    const { db } = setup<Doc>({ memory });

    const docs = db.update({}, { geolocation: { type: 'Point' } });
    assert.strictEqual(docs.length, 988, 'replaced docs (nested');
  });

  await t.test('replaces docs if matches are found (complex)', () => {
    const { db } = setup<Doc>({ memory });

    const docs = db.update({}, { geolocation: { coordinates: { $has: 56.18333 } } });
    assert.strictEqual(docs.length, 1, 'replaced docs (complex)');
  });

  await t.test('returns empty array if query does not match', () => {
    const { db } = setup<Doc>({ memory });

    const docs = db.update({}, { _id: '-3' });
    assert.strictEqual(docs.length, 0, 'does not replace docs (no match)');
  });

  await t.test('replaces docs if any query matches', () => {
    const { db } = setup<Doc>({ memory });

    const docs = db.update({},
      { _id: '-3' },
      { geolocation: { coordinates: { $has: 56.18333 } } });
    assert.strictEqual(docs.length, 1, 'replaced docs (any match)');
  });

  await t.test('throws if update contains _id', () => {
    const { db } = setup<Doc>({ memory });

    // @ts-expect-error
    assert.throws(() => db.update({ _id: '3' }, {}));
  });
});

test('[leafdb.delete]', async t => {
  await t.test('deletes docs if matches are found (simple)', () => {
    const { db } = setup<Doc>({ memory });

    const docs = db.delete({ mass: '720' });
    assert.strictEqual(docs, 2, 'deletes docs (simple)');
  });

  await t.test('deletes docs if matches are found (nested)', () => {
    const { db } = setup<Doc>({ memory });

    const docs = db.delete({ geolocation: { type: 'Point' } });
    assert.strictEqual(docs, 988, 'deletes docs (nested)');
  });

  await t.test('deletes docs if matches are found (complex)', () => {
    const { db } = setup<Doc>({ memory });

    const docs = db.delete({ geolocation: { coordinates: { $has: 10.23333 } } });
    assert.strictEqual(docs, 1, 'deletes docs (complex)');
  });

  await t.test('returns 0 if no match is found', () => {
    const { db } = setup<Doc>({ memory });

    const docs = db.delete({ _id: '-1' });
    assert.strictEqual(docs, 0, 'does not delete docs');
  });

  await t.test('deletes docs if any query matches', () => {
    const { db } = setup<Doc>({ memory });

    const docs = db.delete(
      { _id: '-1' },
      { geolocation: { coordinates: { $has: 10.23333 } } }
    );
    assert.strictEqual(docs, 1, 'delete docs (any match)');
  });
});

test('[leafdb.drop]', async t => {
  await t.test('drops data', () => {
    const { db } = setup({ memory });

    db.drop();

    // @ts-expect-error: Read private
    assert.strictEqual(db._memory._docs.size, 0, 'clears memory');
  });

  await t.test('drops data and persists', () => {
    const { db, file } = setup({ memory, root: import.meta.dirname });

    db.open();
    db.drop();
    db.close();

    // @ts-expect-error: Read private
    assert.strictEqual(db._memory._docs.size, 0, 'clears memory');
    assert.strictEqual(fs.readFileSync(file, 'utf-8'), '', 'clears file');
  });
});

test('[leafdb.close]', async t => {
  await t.test('throws in memory mode', () => {
    const { db } = setup();

    assert.throws(() => db.close());
  });

  await t.test('closes storage', () => {
    const { db, file } = setup({ root: import.meta.dirname });
    db.open();

    assert.doesNotThrow(() => db.close());

    const fd = fs.openSync(file, 'r+');
    fs.closeSync(fd);

    fs.rmSync(file);
  });
});
