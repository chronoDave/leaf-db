import test from 'tape';
import fs from 'fs';

import Storage from '../../../src/storage';
import { name, file } from './fixture';

test('[storage.append] throws if not opened', t => {
  const storage = new Storage({ root: __dirname, name });

  try {
    storage.append('');
    t.fail('expected to throw');
  } catch (err) {
    t.pass('throws');
  }

  t.end();
});

test('[storage.append] appens data', t => {
  const data = 'this is test data';
  const storage = new Storage({ root: __dirname, name });
  storage.open();

  storage.append(data);
  // @ts-expect-error: Access private
  fs.closeSync(storage._fd);

  t.true(fs.readFileSync(file, { encoding: 'utf-8' }).includes(data), 'appends data');

  fs.rmSync(file);

  t.end();
});
