const test = require('tape');
const fs = require('fs');

const Storage = require('../../build/storage').default;
const { file, root, name } = require('./fixture');

test('[storage.open] reads and opens file if file exists', t => {
  const text = 'this is test data';

  fs.writeFileSync(file, text);

  const storage = new Storage({ root, name });
  const data = storage.open();

  fs.closeSync(storage._fd);
  fs.rmSync(file);

  t.true(Array.isArray(data), 'returns data array');
  t.equal(data.length, 1, 'has data');
  t.equal(data[0], text, 'has file data');
  t.true(storage._fd, 'opened file');

  t.end();
});

test('[storage.open] creates and opens file if file does not exist', t => {
  const storage = new Storage({ root, name });
  const data = storage.open();

  fs.closeSync(storage._fd);

  t.true(Array.isArray(data), 'returns data array');
  t.equal(data.length, 0, 'does not have data');
  t.true(fs.existsSync(file), 'created file');
  t.true(storage._fd, 'opened file');

  fs.rmSync(file);

  t.end();
});

test('[storage.open] splits data on newline', t => {
  const arr = ['a', 'b', 'c'];
  fs.writeFileSync(file, arr.join('\n'));
  const storage = new Storage({ root, name });
  const data = storage.open();

  fs.closeSync(storage._fd);

  t.equal(data.length, arr.length, 'splits data');
  t.true(data.every((x, i) => x === arr[i]), 'has correct data');

  fs.rmSync(file);

  t.end();
});