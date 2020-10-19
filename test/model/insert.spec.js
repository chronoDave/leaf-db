const test = require('tape');
const fs = require('fs');

const { setup, invalidData } = require('../_utils');

test('[insert] should insert single doc', async t => {
  const payload = { _id: 1 };

  const { db } = setup();

  try {
    await db.insert(payload);

    t.equal(Object.keys(db.data).length, 1);
    t.deepEqual(db.data[1], payload);
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[insert] should insert multiple docs', async t => {
  const payload = [
    { _id: 1 },
    { data: 'test' },
    { name: 'debug', valid: true }
  ];

  const { db } = setup();

  try {
    await db.insert(payload);

    t.equal(Object.keys(db.data).length, payload.length);
    for (let i = 0, v = Object.values(db.data); i < v.length; i += 1) {
      t.ok(payload.includes(v[i]));
    }
  } catch (err) {
    t.fail(err);
  }

  t.end();
});

test('[insert] should persist if option.persist is true', async t => {
  const payload = [
    { _id: 1 },
    { data: 'test' },
    { name: 'debug', valid: true }
  ];

  const { db, file } = setup({ root: __dirname });

  try {
    await db.insert(payload, { persist: true });
  } catch (err) {
    t.fail(err);
  }

  t.ok(fs.existsSync(file));

  fs.unlinkSync(file);

  t.end();
});

test('[insert] should throw on invalid data', async t => {
  const { db } = setup();

  for (let i = 0; i < invalidData.length; i += 1) {
    try {
      await db.insert(invalidData[i]);
      t.fail(`expected to throw: ${i}, ${invalidData[i]}`);
    } catch (err) {
      t.pass(`throws: ${i}`);
    }
  }

  t.end();
});
