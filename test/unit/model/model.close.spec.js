const fs = require('fs');
const test = require('tape');

const { setup } = require('../_utils');

test('[model.close] throws in memory mode', t => {
  const { db } = setup();

  try {
    db.close();
    t.fail('expected to throw');
  } catch (err) {
    t.pass('throws');
  }

  t.end();
});

test('[model.close] closes storage', t => {
  const { db, file } = setup({ root: __dirname });
  db.open();

  try {
    db.close();
    const fd = fs.openSync(file, 'r+');
    t.pass('unlocks file');
    fs.closeSync(fd);
  } catch (err) {
    t.fail(err);
  }

  fs.rmSync(file);

  t.end();
});
