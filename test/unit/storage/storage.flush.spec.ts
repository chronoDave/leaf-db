import test from 'tape';
import fs from 'fs';

import { file, name } from './fixture';
import Storage from '../../../src/storage';

test('[storage.flush] throws if not opened', t => {
  const storage = new Storage({ root: __dirname, name });

  try {
    storage.flush();
    t.fail('expected to throw');
  } catch (err) {
    t.pass('throws');
  }

  t.end();
});

test('[storage.flush] clears file', t => {
  fs.writeFileSync(file, 'this is some data');
  const storage = new Storage({ root: __dirname, name });
  storage.open();

  storage.flush();
  // @ts-expect-error: Access private
  fs.closeSync(storage._fd);

  t.true(fs.existsSync(file), 'file exists');
  t.equal(fs.readFileSync(file, { encoding: 'utf-8' }).length, 0, 'is empty');

  fs.rmSync(file);

  t.end();
});
