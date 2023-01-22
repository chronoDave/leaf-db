import test from 'tape';
import fs from 'fs';

import { file, name } from './fixture';
import Storage from '../../../src/storage';

test('[storage.close] throws if not opened', t => {
  const storage = new Storage({ root: __dirname, name });

  try {
    storage.close();
    t.fail('expected to throw');
  } catch (err) {
    t.pass('throws');
  }

  t.end();
});

test('[storage.close] closes file', t => {
  const storage = new Storage({ root: __dirname, name });
  storage.open();

  storage.close();

  // @ts-expect-error: Access private
  t.false(storage._fd, 'unsets fd');
  try {
    const fd = fs.openSync(file, 'r+');
    t.pass('unlocks file');
    fs.closeSync(fd);
  } catch (err) {
    t.fail((err as Error).message);
  }

  fs.rmSync(file);

  t.end();
});
