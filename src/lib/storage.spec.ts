import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';

import Storage from './storage.ts';
import { name, file } from './storage.struct.ts';

test('[storage.open]', async t => {
  await t.test('reads and opens file if file exists', () => {
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
  
  await t.test('creates and opens file if file does not exist', () => {
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
  
  await t.test('splits data on newline', () => {
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
});

test('[storage.append]', async t => {
  await t.test('throws if not opened', () => {
    const storage = new Storage({ root: import.meta.dirname, name });

    assert.throws(() => storage.append(''));
  });

  await t.test('appens data', () => {
    const data = 'this is test data';
    const storage = new Storage({ root: import.meta.dirname, name });
    storage.open();

    storage.append(data);
    // @ts-expect-error: Access private
    fs.closeSync(storage._fd);

    assert.ok(fs.readFileSync(file, { encoding: 'utf-8' }).includes(data), 'appends data');

    fs.rmSync(file);
  });
});

test('[storage.flush]', async t => {
  await t.test('throws if not opened', () => {
    const storage = new Storage({ root: import.meta.dirname, name });
  
    assert.throws(() => storage.flush());
  });
  
  await t.test('clears file', () => {
    fs.writeFileSync(file, 'this is some data');
    const storage = new Storage({ root: import.meta.dirname, name });
    storage.open();
  
    storage.flush();
    // @ts-expect-error: Access private
    fs.closeSync(storage._fd);
  
    assert.ok(fs.existsSync(file), 'file exists');
    assert.equal(fs.readFileSync(file, { encoding: 'utf-8' }).length, 0, 'is empty');
  
    fs.rmSync(file);
  });
});

test('[storage.close]', async t => {
  await t.test('throws if not opened', () => {
    const storage = new Storage({ root: import.meta.dirname, name });
  
    assert.throws(() => storage.close());
  });
  
  await t.test('closes file', () => {
    const storage = new Storage({ root: import.meta.dirname, name });
    storage.open();
  
    storage.close();
  
    // @ts-expect-error: Access private
    assert.ok(!storage._fd, 'unsets fd');
    assert.doesNotThrow(() => {
      const fd = fs.openSync(file, 'r+');
      fs.closeSync(fd);
    });
  
    fs.rmSync(file);
  });
});
