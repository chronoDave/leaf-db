import test from 'tape';

import setup, { memory } from './fixture';

test('[model.delete] deletes docs if matches are found (simple)', t => {
  const { db } = setup({ memory });

  const docs = db.delete({ mass: '720' });
  t.strictEqual(docs, 2, 'deletes docs (simple)');

  t.end();
});

test('[model.delete] deletes docs if matches are found (nested)', t => {
  const { db } = setup({ memory });

  const docs = db.delete({ geolocation: { type: 'Point' } });
  t.strictEqual(docs, 988, 'deletes docs (nested)');

  t.end();
});

test('[model.delete] deletes docs if matches are found (complex)', t => {
  const { db } = setup({ memory });

  const docs = db.delete({ geolocation: { coordinates: { $has: 10.23333 } } });
  t.strictEqual(docs, 1, 'deletes docs (complex)');

  t.end();
});

test('[model.delete] returns 0 if no match is found', t => {
  const { db } = setup({ memory });

  const docs = db.delete({ _id: '-1' });
  t.strictEqual(docs, 0, 'does not delete docs');

  t.end();
});

test('[model.delete] deletes docs if any query matches', t => {
  const { db } = setup({ memory });

  const docs = db.delete(
    { _id: '-1' },
    { geolocation: { coordinates: { $has: 10.23333 } } }
  );
  t.strictEqual(docs, 1, 'delete docs (any match)');

  t.end();
});
