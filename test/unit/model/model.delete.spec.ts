import type { Doc } from './fixture.ts';

import test from 'node:test';
import assert from 'node:assert/strict';

import setup, { memory } from './fixture.ts';

test('[model.delete] deletes docs if matches are found (simple)', () => {
  const { db } = setup<Doc>({ memory });

  const docs = db.delete({ mass: '720' });
  assert.strictEqual(docs, 2, 'deletes docs (simple)');
});

test('[model.delete] deletes docs if matches are found (nested)', () => {
  const { db } = setup<Doc>({ memory });

  const docs = db.delete({ geolocation: { type: 'Point' } });
  assert.strictEqual(docs, 988, 'deletes docs (nested)');
});

test('[model.delete] deletes docs if matches are found (complex)', () => {
  const { db } = setup<Doc>({ memory });

  const docs = db.delete({ geolocation: { coordinates: { $has: 10.23333 } } });
  assert.strictEqual(docs, 1, 'deletes docs (complex)');
});

test('[model.delete] returns 0 if no match is found', () => {
  const { db } = setup<Doc>({ memory });

  const docs = db.delete({ _id: '-1' });
  assert.strictEqual(docs, 0, 'does not delete docs');
});

test('[model.delete] deletes docs if any query matches', () => {
  const { db } = setup<Doc>({ memory });

  const docs = db.delete(
    { _id: '-1' },
    { geolocation: { coordinates: { $has: 10.23333 } } }
  );
  assert.strictEqual(docs, 1, 'delete docs (any match)');
});
