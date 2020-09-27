const test = require('tape');
const path = require('path');
const fs = require('fs');

const LeafDB = require('../../src/model');

test('[constructor] should create in-memory database', t => {
  const name = 'test';
  const db = new LeafDB(name);

  t.ok(typeof db.data === 'object');
  t.equal(Object.keys(db.data).length, 0);
  t.notOk(fs.existsSync(path.resolve(__dirname, `${name}.txt`)));

  t.end();
});

test('[constructor] should create persistent database', t => {
  const name = 'test';
  const root = path.resolve(__dirname, 'db');
  const file = path.resolve(root, `${name}.txt`);

  // eslint-disable-next-line no-new
  new LeafDB(name, { root });

  t.ok(fs.existsSync(file));

  fs.rmdirSync(root, { recursive: true });

  t.end();
});
