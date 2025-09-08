import test from 'node:test';
import assert from 'node:assert/strict';

import type { Doc } from './fixture';
import setup, { memory } from './fixture';

test('[model.selectById] returns docs on empty query', t => {
  const { db } = setup<Doc>({ memory });

  const docs = db.selectById();
  assert.ok(Array.isArray(docs), 'is array');
  assert.strictEqual(docs.length, 0, 'finds docs (empty)');
});

test('[model.selectById] returns docs on id match', t => {
  const { db } = setup<Doc>({ memory });

  const docs = db.selectById('2', '6');
  assert.strictEqual(docs.length, 2, 'finds docs');
  assert.strictEqual(docs[0].name, 'Aarhus', 'finds correct docs');
});
