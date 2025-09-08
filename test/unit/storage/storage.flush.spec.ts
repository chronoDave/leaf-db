import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';

import { file, name } from './fixture';
import Storage from '../../../src/storage';

test('[storage.flush] throws if not opened', () => {
  const storage = new Storage({ root: __dirname, name });

  assert.throws(() => storage.flush());
});

test('[storage.flush] clears file', () => {
  fs.writeFileSync(file, 'this is some data');
  const storage = new Storage({ root: __dirname, name });
  storage.open();

  storage.flush();
  // @ts-expect-error: Access private
  fs.closeSync(storage._fd);

  assert.ok(fs.existsSync(file), 'file exists');
  assert.equal(fs.readFileSync(file, { encoding: 'utf-8' }).length, 0, 'is empty');

  fs.rmSync(file);
});
