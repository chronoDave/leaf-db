import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';

import { file, name } from './fixture.ts';
import Storage from '../../../src/lib/storage.ts';

test('[storage.open] reads and opens file if file exists', () => {
  const text = 'this is test data';

  fs.writeFileSync(file, text);

  const storage = new Storage({ root: import.meta.dirname, name });
  const data = storage.open();

  // @ts-expect-error: Access private
  fs.closeSync(storage._fd);
  fs.rmSync(file);

  assert.ok(Array.isArray(data), 'returns data array');
  assert.equal(data.length, 1, 'has data');
  assert.equal(data[0], text, 'has file data');
  // @ts-expect-error: Access private
  assert.ok(storage._fd, 'opened file');
});

test('[storage.open] creates and opens file if file does not exist', () => {
  const storage = new Storage({ root: import.meta.dirname, name });
  const data = storage.open();

  // @ts-expect-error: Access private
  fs.closeSync(storage._fd);

  assert.ok(Array.isArray(data), 'returns data array');
  assert.equal(data.length, 0, 'does not have data');
  assert.ok(fs.existsSync(file), 'created file');
  // @ts-expect-error: Access private
  assert.ok(storage._fd, 'opened file');

  fs.rmSync(file);
});

test('[storage.open] splits data on newline', () => {
  const arr = [JSON.stringify({ _id: 'a' }), JSON.stringify({ _id: '\nb' })];
  fs.writeFileSync(file, arr.join('\n'));
  const storage = new Storage({ root: import.meta.dirname, name });
  const data = storage.open();

  // @ts-expect-error: Access private
  fs.closeSync(storage._fd);

  assert.equal(data.length, arr.length, 'splits data');
  assert.ok(data.every((x, i) => x === arr[i]), 'has correct data');

  fs.rmSync(file);
});
