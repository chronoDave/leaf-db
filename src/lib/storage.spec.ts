import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import fsp from 'fs/promises';

import struct from './storage.struct.ts';

test('[storage.open]', async t => {
  await t.test('reads and opens file if file exists', async () => {
    const text = 'this is test data';
    const { storage, cleanup } = await struct(text);
  
    const entries = await storage.open();
    await storage.close();
  
    assert.equal(entries.length, 1, 'has data');
    assert.equal(entries[0], text, 'has file data');

    await cleanup();
  });
  
  await t.test('creates and opens file if file does not exist', async () => {
    const { storage, file, cleanup } = await struct();

    const entries = await storage.open();
    await storage.close();
  
    assert.equal(entries.length, 0, 'does not have data');
    assert.ok(fs.existsSync(file), 'created file');
  
    await cleanup();
  });
  
  await t.test('splits data on newline', async () => {
    const text = [{ _id: 'a' }, { _id: 'b' }]
      .map(x => JSON.stringify(x))
      .join('\n');
    const { storage, cleanup } = await struct(text);
    
    const entries = await storage.open();
    await storage.close();

    assert.equal(entries.length, 2, 'splits data');
    assert.deepEqual(entries[0], JSON.stringify({ _id: 'a' }), 'has correct data');
  
    await cleanup();
  });
});

test('[storage.write]', async t => {
  await t.test('writes data', async () => {
    const data = 'new data';
    const { storage, file, cleanup } = await struct('this is test data');

    await storage.open();
    await storage.write(data);
    await storage.close();

    const raw = await fsp.readFile(file, 'utf-8');
    assert.equal(data, raw.trim(), 'writes data');

    await cleanup();
  });
});

test('[storage.append]', async t => {
  await t.test('rejects if not opened', async () => {
    const { storage } = await struct();

    await assert.rejects(async () => storage.append(''));
  });

  await t.test('appens data', async () => {
    const data = 'this is test data';
    const { storage, file, cleanup } = await struct();

    await storage.open();
    await storage.append(data);
    await storage.close();

    const raw = await fsp.readFile(file, 'utf-8');
    assert.equal(data, raw.trim(), 'appends data');

    await cleanup();
  });
});

test('[storage.flush] clears file', async () => {  
  const { storage, file, cleanup } = await struct('this is some data');

  await storage.open();
  await storage.flush();
  await storage.close();

  const raw = await fsp.readFile(file, 'utf-8');
  assert.equal(raw.length, 0, 'is empty');

  await cleanup();
});

test('[storage.close] closes file', async () => {  
  const { storage, file, cleanup } = await struct();

  await storage.open();
  await storage.close();

  await assert.doesNotReject(async () => fsp.readFile(file), 'releases file');

  await cleanup();
});
