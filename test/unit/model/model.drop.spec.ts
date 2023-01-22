import fs from 'fs';
import test from 'tape';

import setup, { memory } from './fixture';

test('[model.drop] drops data', async t => {
  const { db } = setup({ memory });

  db.drop();

  // @ts-expect-error: Read private
  t.strictEqual(db._memory._docs.size, 0, 'clears memory');

  t.end();
});

test('[model.drop] drops data and persists', t => {
  const { db, file } = setup({ memory, root: __dirname });

  db.open();
  db.drop();
  db.close();

  // @ts-expect-error: Read private
  t.strictEqual(db._memory._docs.size, 0, 'clears memory');
  t.strictEqual(fs.readFileSync(file, 'utf-8'), '', 'clears file');

  t.end();
});
