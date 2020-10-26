const fs = require('fs');
const path = require('path');

const test = require('tape');

const LeafDB = require('../../dist/model');

test('[constructor] should create in-memory database', t => {
  const name = 'test';
  const db = new LeafDB(name);

  t.true(typeof db.data === 'object');
  t.equal(Object.keys(db.data).length, 0);
  t.false(fs.existsSync(path.resolve(__dirname, `${name}.txt`)));

  t.end();
});

test('[constructor] should create persistent database', t => {
  const name = 'test';
  const root = path.resolve(__dirname, 'db');
  const file = path.resolve(root, `${name}.txt`);

  // eslint-disable-next-line no-new
  new LeafDB(name, { root });

  t.true(fs.existsSync(file));

  fs.rmdirSync(root, { recursive: true });

  t.end();
});
