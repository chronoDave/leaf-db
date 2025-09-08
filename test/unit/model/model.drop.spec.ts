import fs from 'fs';
import test from 'node:test';
import assert from 'node:assert/strict';

import setup, { memory } from './fixture';

test('[model.drop] drops data', async () => {
  const { db } = setup({ memory });

  db.drop();

  // @ts-expect-error: Read private
  assert.strictEqual(db._memory._docs.size, 0, 'clears memory');
});

test('[model.drop] drops data and persists', () => {
  const { db, file } = setup({ memory, root: import.meta.dirname });

  db.open();
  db.drop();
  db.close();

  // @ts-expect-error: Read private
  assert.strictEqual(db._memory._docs.size, 0, 'clears memory');
  assert.strictEqual(fs.readFileSync(file, 'utf-8'), '', 'clears file');
});
