import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';

import Storage from '../../../src/storage';
import { name, file } from './fixture';

test('[storage.append] throws if not opened', () => {
  const storage = new Storage({ root: __dirname, name });

  assert.throws(() => storage.append(''));
});

test('[storage.append] appens data', () => {
  const data = 'this is test data';
  const storage = new Storage({ root: __dirname, name });
  storage.open();

  storage.append(data);
  // @ts-expect-error: Access private
  fs.closeSync(storage._fd);

  assert.ok(fs.readFileSync(file, { encoding: 'utf-8' }).includes(data), 'appends data');

  fs.rmSync(file);
});
