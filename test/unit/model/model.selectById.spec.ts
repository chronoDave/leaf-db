import test from 'tape';

import type { Doc } from './fixture';
import setup, { memory } from './fixture';

test('[model.selectById] returns docs on empty query', t => {
  const { db } = setup<Doc>({ memory });

  const docs = db.selectById();
  t.true(Array.isArray(docs), 'is array');
  t.strictEqual(docs.length, 0, 'finds docs (empty)');

  t.end();
});

test('[model.selectById] returns docs on id match', t => {
  const { db } = setup<Doc>({ memory });

  const docs = db.selectById('2', '6');
  t.strictEqual(docs.length, 2, 'finds docs');
  t.strictEqual(docs[0].name, 'Aarhus', 'finds correct docs');

  t.end();
});
