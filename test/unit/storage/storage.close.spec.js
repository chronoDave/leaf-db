const test = require('tape');
const fs = require('fs');

const Storage = require('../../build/storage').default;
const { file, name, root } = require('./fixture');

test('[storage.close] throws if not opened', t => {
  const storage = new Storage({ root, name });

  try {
    storage.close();
    t.fail('expected to throw');
  } catch (err) {
    t.pass('throws');
  }

  t.end();
});

test('[storage.close] closes file', t => {
  const storage = new Storage({ root, name });
  storage.open();

  storage.close();

  t.false(storage._fd, 'unsets fd');
  try {
    const fd = fs.openSync(file, 'r+');
    t.pass('unlocks file');
    fs.closeSync(fd);
  } catch (err) {
    t.fail(err);
  }

  fs.rmSync(file);

  t.end();
});
