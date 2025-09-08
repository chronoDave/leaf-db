import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';

import setup from './fixture';

test('[model.close] throws in memory mode', () => {
  const { db } = setup();

  assert.throws(() => db.close());
});

test('[model.close] closes storage', () => {
  const { db, file } = setup({ root: __dirname });
  db.open();

  assert.doesNotThrow(() => db.close());

  const fd = fs.openSync(file, 'r+');
  fs.closeSync(fd);

  fs.rmSync(file);
});
