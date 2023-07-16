import test from 'tape';

import setup, { memory } from './fixture';

test('[model.find] returns docs on empty query', t => {
  const { db } = setup({ memory });

  const docs = db.find({});
  t.true(Array.isArray(docs), 'is array');
  t.strictEqual(docs.length, Object.keys(memory).length, 'finds docs (empty)');

  t.end();
});

test('[model.find] returns docs on query match (simple)', t => {
  const { db } = setup({ memory });

  const docs = db.find({ nametype: 'Valid' });
  t.strictEqual(docs.length, 1000, 'finds docs (simple)');

  t.end();
});

test('[model.find] returns docs on query match (nested)', t => {
  const { db } = setup({ memory });

  const docs = db.find({ geolocation: { type: 'Point' } });
  t.strictEqual(docs.length, 988, 'finds docs (nested)');

  t.end();
});

test('[model.find] returns docs on query match (complex)', t => {
  const { db } = setup({ memory });

  const docs = db.find({ geolocation: { coordinates: { $has: 56.18333 } } });
  t.strictEqual(docs.length, 1, 'finds docs (complex)');

  t.end();
});

test('[model.find] returns empty array if query does not match', t => {
  const { db } = setup({ memory });

  const docs = db.find({ geolocation: { coordinates: { $has: -1 } } });
  t.strictEqual(docs.length, 0, 'does not find docs (no match)');

  t.end();
});

test('[model.find] returns docs if any query matches', t => {
  const { db } = setup({ memory });

  const docs = db.find(
    { geolocation: { coordinates: { $has: -1 } } },
    { geolocation: { coordinates: { $has: 56.18333 } } }
  );
  t.strictEqual(docs.length, 1, 'finds docs (any match)');

  t.end();
});
