import test from 'tape';
import fs from 'fs';

import { file, name } from './fixture';
import Storage from '../../../src/storage';

test('[storage.open] reads and opens file if file exists', t => {
  const text = 'this is test data';

  fs.writeFileSync(file, text);

  const storage = new Storage({ root: __dirname, name });
  const data = storage.open();

  // @ts-expect-error: Access private
  fs.closeSync(storage._fd);
  fs.rmSync(file);

  t.true(Array.isArray(data), 'returns data array');
  t.equal(data.length, 1, 'has data');
  t.equal(data[0], text, 'has file data');
  // @ts-expect-error: Access private
  t.true(storage._fd, 'opened file');

  t.end();
});

test('[storage.open] creates and opens file if file does not exist', t => {
  const storage = new Storage({ root: __dirname, name });
  const data = storage.open();

  // @ts-expect-error: Access private
  fs.closeSync(storage._fd);

  t.true(Array.isArray(data), 'returns data array');
  t.equal(data.length, 0, 'does not have data');
  t.true(fs.existsSync(file), 'created file');
  // @ts-expect-error: Access private
  t.true(storage._fd, 'opened file');

  fs.rmSync(file);

  t.end();
});

test('[storage.open] splits data on newline', t => {
  const arr = [JSON.stringify({ _id: 'a' }), JSON.stringify({ _id: '\nb' })];
  fs.writeFileSync(file, arr.join('\n'));
  const storage = new Storage({ root: __dirname, name });
  const data = storage.open();

  // @ts-expect-error: Access private
  fs.closeSync(storage._fd);

  t.equal(data.length, arr.length, 'splits data');
  t.true(data.every((x, i) => x === arr[i]), 'has correct data');

  fs.rmSync(file);

  t.end();
});
