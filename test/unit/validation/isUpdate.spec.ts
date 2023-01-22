import test from 'tape';

import { isUpdate } from '../../../src/validation';
import { update } from './fixture';

test('[isUpdate] should return false if update is invalid', t => {
  for (let i = 0; i < update.length; i += 1) {
    t.false(isUpdate(update[i]), JSON.stringify(update[i]));
  }

  t.end();
});

test('[isUpdate] should return true if update is valid', t => {
  t.true(isUpdate({ a: 3 }));
  t.true(isUpdate({ a: { b: 2 } }));
  t.true(isUpdate({ a: { b: [{ c: 3 }] } }));
  t.true(isUpdate({ $set: { a: 3 } }));
  t.true(isUpdate({ $set: { a: { b: 2 } } }));
  t.true(isUpdate({ $set: { a: { b: [{ c: 3 }] } } }));
  t.true(isUpdate({ $set: { a: 3 }, $push: { b: 3 } }));
  t.true(isUpdate({ test: 'test' }));

  t.end();
});
