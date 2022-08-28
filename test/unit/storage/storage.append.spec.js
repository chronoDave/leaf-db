const test = require('tape');
const fs = require('fs');

const Storage = require('../../build/storage').default;
const { root, name, file } = require('./fixture');

test('[storage.append] throws if not opened', t => {
  const storage = new Storage({ root });

  try {
    storage.append();
    t.fail('expected to throw');
  } catch (err) {
    t.pass('throws');
  }

  t.end();
});

test('[storage.append] appens data', t => {
  const data = 'this is test data';
  const storage = new Storage({ root, name });
  storage.open();

  storage.append(data);
  fs.closeSync(storage._fd);

  t.true(fs.readFileSync(file, { encoding: 'utf-8' }).includes(data), 'appends data');

  fs.rmSync(file);

  t.end();
});
