const fs = require('fs');
const path = require('path');

const test = require('tape');

const LeafDB = require('../build/model');

test('[constructor] should create in-memory database when no arguments are provided', t => {
  const db = new LeafDB();

  t.true(typeof db.data === 'object');
  t.equal(Object.keys(db.data).length, 0);
  t.false(fs.readdirSync(__dirname, { recursive: true }).some(file => file.includes('.txt')));

  t.end();
});

test('[constructor] should create persistent database', t => {
  const name = 'test';
  const root = path.resolve(__dirname, 'db');
  const file = path.resolve(root, `${name}.txt`);

  // eslint-disable-next-line no-new
  new LeafDB({ name, root });

  t.true(fs.existsSync(file));

  fs.rmdirSync(root, { recursive: true });

  t.end();
});
