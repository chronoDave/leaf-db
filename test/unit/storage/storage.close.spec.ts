import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';

import { file, name } from './fixture';
import Storage from '../../../src/storage';

test('[storage.close] throws if not opened', () => {
  const storage = new Storage({ root: import.meta.dirname, name });

  assert.throws(() => storage.close());
});

test('[storage.close] closes file', () => {
  const storage = new Storage({ root: import.meta.dirname, name });
  storage.open();

  storage.close();

  // @ts-expect-error: Access private
  assert.ok(!storage._fd, 'unsets fd');
  assert.doesNotThrow(() => {
    const fd = fs.openSync(file, 'r+');
    fs.closeSync(fd);
  });

  fs.rmSync(file);
});
