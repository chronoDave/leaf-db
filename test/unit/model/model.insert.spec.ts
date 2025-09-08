import fs from 'fs';
import test from 'node:test';
import assert from 'node:assert/strict';

import setup, { data } from './fixture';

test('[model.insert] inserts docs', () => {
  const { db } = setup();

  const docs = db.insert(data);
  assert.ok(Array.isArray(docs), 'is array');
  assert.strictEqual(docs.length, data.length, 'inserts docs');
  assert.deepEqual(docs[0], data[0], 'is doc');
});

test('[model.insert] inserts docs in memory', () => {
  const { db } = setup();

  db.insert(data);
  const docs = db.select({});
  assert.ok(Array.isArray(docs), 'is array');
  assert.strictEqual(docs.length, data.length, 'inserts docs');
  assert.deepEqual(docs[0], data[0], 'is doc');
});

test('[model.insert] does not insert duplicate docs', () => {
  const { db } = setup();

  assert.throws(() => db.insert([{ _id: '1' }, { _id: '2' }, { _id: '1' }]));
});

test('[model.insert] does not insert docs if any doc is invalid', () => {
  const { db } = setup();

  assert.throws(() => db.insert([{ _id: '1' }, { _id: '2' }, { _id: '1' }]));
});

test('[model.insert] inserts duplicate drafts', () => {
  const { db } = setup();

  const drafts = [{ a: 1 }, { a: 1 }];
  const docs = db.insert(drafts);

  assert.equal(drafts.length, docs.length, 'inserts duplicate drafts');
});
