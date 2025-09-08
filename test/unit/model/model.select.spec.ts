import test from 'node:test';
import assert from 'node:assert/strict';

import type { Doc } from './fixture';
import setup, { memory } from './fixture';

test('[model.select] returns docs on empty query', () => {
  const { db } = setup<Doc>({ memory });

  const docs = db.select({});
  assert.ok(Array.isArray(docs), 'is array');
  assert.strictEqual(docs.length, Object.keys(memory).length, 'finds docs (empty)');
});

test('[model.select] returns docs on query match (simple)', () => {
  const { db } = setup<Doc>({ memory });

  const docs = db.select({ nametype: 'Valid' });
  assert.strictEqual(docs.length, 1000, 'finds docs (simple)');
});

test('[model.select] returns docs on query match (nested)', () => {
  const { db } = setup<Doc>({ memory });

  const docs = db.select({ geolocation: { type: 'Point' } });
  assert.strictEqual(docs.length, 988, 'finds docs (nested)');
});

test('[model.select] returns docs on query match (complex)', () => {
  const { db } = setup<Doc>({ memory });

  const docs = db.select({ geolocation: { coordinates: { $has: 56.18333 } } });
  assert.strictEqual(docs.length, 1, 'finds docs (complex)');
});

test('[model.select] returns empty array if query does not match', () => {
  const { db } = setup<Doc>({ memory });

  const docs = db.select({ geolocation: { coordinates: { $has: -1 } } });
  assert.strictEqual(docs.length, 0, 'does not find docs (no match)');
});

test('[model.select] returns docs if any query matches', () => {
  const { db } = setup<Doc>({ memory });

  const docs = db.select(
    { geolocation: { coordinates: { $has: -1 } } },
    { geolocation: { coordinates: { $has: 56.18333 } } }
  );
  assert.strictEqual(docs.length, 1, 'finds docs (any match)');
});
