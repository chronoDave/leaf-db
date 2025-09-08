import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';

import Storage from '../../../src/lib/storage.ts';
import { name, file } from './fixture.ts';

test('[storage.append] throws if not opened', () => {
  const storage = new Storage({ root: import.meta.dirname, name });

  assert.throws(() => storage.append(''));
});

test('[storage.append] appens data', () => {
  const data = 'this is test data';
  const storage = new Storage({ root: import.meta.dirname, name });
  storage.open();

  storage.append(data);
  // @ts-expect-error: Access private
  fs.closeSync(storage._fd);

  assert.ok(fs.readFileSync(file, { encoding: 'utf-8' }).includes(data), 'appends data');

  fs.rmSync(file);
});
