const test = require('tape');

const { isValidUpdate } = require('../../build/validation');

// Utils
const { invalidUpdate } = require('../_utils');

test('[isValidUpdate] should return false if update is invalid', t => {
  for (let i = 0; i < invalidUpdate.length; i += 1) {
    t.false(isValidUpdate(invalidUpdate[i]), i);
  }

  t.end();
});

test('[isValidUpdate] should return true if update is valid', t => {
  t.true(isValidUpdate({ a: 3 }));
  t.true(isValidUpdate({ a: { b: 2 } }));
  t.true(isValidUpdate({ a: { b: [{ c: 3 }] } }));
  t.true(isValidUpdate({ $set: { a: 3 } }));
  t.true(isValidUpdate({ $set: { a: { b: 2 } } }));
  t.true(isValidUpdate({ $set: { a: { b: [{ c: 3 }] } } }));
  t.true(isValidUpdate({ $set: { a: 3 }, $push: { b: 3 } }));

  t.end();
});
