import test from 'node:test';
import assert from 'node:assert/strict';

import type { Doc } from './fixture.ts';
import setup, { memory } from './fixture.ts';

test('[model.update] replaces docs on empty query', () => {
  const { db } = setup<Doc>({ memory });

  const docs = db.update({}, {});
  assert.ok(Array.isArray(docs), 'is array');
  assert.strictEqual(docs.length, Object.keys(memory).length, 'replaced docs (empty)');
});

test('[model.update] replaces docs if matches are found (simple)', () => {
  const { db } = setup<Doc>({ memory });

  const docs = db.update({}, { recclass: 'H6' });
  assert.strictEqual(docs.length, 77, 'replaced docs (simple');
});

test('[model.update] replaces docs if matches are found (nested)', () => {
  const { db } = setup<Doc>({ memory });

  const docs = db.update({}, { geolocation: { type: 'Point' } });
  assert.strictEqual(docs.length, 988, 'replaced docs (nested');
});

test('[model.update] replaces docs if matches are found (complex)', () => {
  const { db } = setup<Doc>({ memory });

  const docs = db.update({}, { geolocation: { coordinates: { $has: 56.18333 } } });
  assert.strictEqual(docs.length, 1, 'replaced docs (complex)');
});

test('[model.update] returns empty array if query does not match', () => {
  const { db } = setup<Doc>({ memory });

  const docs = db.update({}, { _id: '-3' });
  assert.strictEqual(docs.length, 0, 'does not replace docs (no match)');
});

test('[model.update] replaces docs if any query matches', () => {
  const { db } = setup<Doc>({ memory });

  const docs = db.update({},
    { _id: '-3' },
    { geolocation: { coordinates: { $has: 56.18333 } } });
  assert.strictEqual(docs.length, 1, 'replaced docs (any match)');
});

test('[model.update] throws if update contains _id', () => {
  const { db } = setup<Doc>({ memory });

  // @ts-expect-error
  assert.throws(() => db.update({ _id: '3' }, {}));
});
