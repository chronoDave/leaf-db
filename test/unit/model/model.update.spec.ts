import test from 'tape';

import type { Doc } from './fixture';
import setup, { memory } from './fixture';

test('[model.update] replaces docs on empty query', t => {
  const { db } = setup<Doc>({ memory });

  const docs = db.update({}, {});
  t.true(Array.isArray(docs), 'is array');
  t.strictEqual(docs.length, Object.keys(memory).length, 'replaced docs (empty)');

  t.end();
});

test('[model.update] replaces docs if matches are found (simple)', t => {
  const { db } = setup<Doc>({ memory });

  const docs = db.update({}, { recclass: 'H6' });
  t.strictEqual(docs.length, 77, 'replaced docs (simple');

  t.end();
});

test('[model.update] replaces docs if matches are found (nested)', t => {
  const { db } = setup<Doc>({ memory });

  const docs = db.update({}, { geolocation: { type: 'Point' } });
  t.strictEqual(docs.length, 988, 'replaced docs (nested');

  t.end();
});

test('[model.update] replaces docs if matches are found (complex)', t => {
  const { db } = setup<Doc>({ memory });

  const docs = db.update({}, { geolocation: { coordinates: { $has: 56.18333 } } });
  t.strictEqual(docs.length, 1, 'replaced docs (complex)');

  t.end();
});

test('[model.update] returns empty array if query does not match', t => {
  const { db } = setup<Doc>({ memory });

  const docs = db.update({}, { _id: '-3' });
  t.strictEqual(docs.length, 0, 'does not replace docs (no match)');

  t.end();
});

test('[model.update] replaces docs if any query matches', t => {
  const { db } = setup<Doc>({ memory });

  const docs = db.update({},
    { _id: '-3' },
    { geolocation: { coordinates: { $has: 56.18333 } } });
  t.strictEqual(docs.length, 1, 'replaced docs (any match)');

  t.end();
});

test('[model.update] throws if update contains _id', t => {
  const { db } = setup<Doc>({ memory });

  try {
    // @ts-expect-error: Test
    db.update({ _id: '3' }, {});
    t.fail('expected to throw');
  } catch (err) {
    t.pass('throws');
  }

  t.end();
});
