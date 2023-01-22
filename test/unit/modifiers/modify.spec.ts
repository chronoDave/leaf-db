import test from 'tape';

import { modify } from '../../../src/modifiers';

test('[modify] operator $add should increase field with value', t => {
  t.strictEqual(modify(
    { a: 1 },
    { $add: { a: 2 } }
  ).a, 3);
  t.strictEqual(modify(
    { a: 1 },
    { $add: { a: -2 } }
  ).a, -1);
  t.strictEqual(modify(
    { a: { b: 1 } },
    { $add: { 'a.b': 2 } }
  ).a.b, 3);
  t.strictEqual(modify(
    { a: { b: [{ c: 1 }] } },
    { $add: { 'a.b.0.c': 2 } }
  ).a.b[0].c, 3);

  t.end();
});

test('[modify] operator $add should return unmodified value if field is not a number', t => {
  t.deepEqual(modify({ a: '1' }, { $add: { a: 1 } }), { a: '1' });

  t.end();
});

test('[modify] operator $set should set field with value', t => {
  t.deepEqual(modify(
    { a: 1 },
    { $set: { a: { b: 1 } } }
  ), { a: { b: 1 } });
  t.deepEqual(modify(
    { a: { c: 1 } },
    { $set: { a: { b: 1 } } }
  ), { a: { b: 1 } });
  t.deepEqual(modify(
    { a: { b: 1 } },
    { $set: { 'a.b': { c: 1 } } }
  ), { a: { b: { c: 1 } } });
  t.deepEqual(modify(
    { a: { b: [{ c: 1 }] } },
    { $set: { 'a.b.0.c': { d: 1 } } }
  ), { a: { b: [{ c: { d: 1 } }] } });
  t.deepEqual(modify(
    { a: 1 },
    { $set: { b: { c: 1 } } }
  ), { a: 1, b: { c: 1 } });
  t.deepEqual(modify(
    { _id: 'key_1', data: 'test', values: [1, 2, 3], testValue: 1 },
    { $set: { newValue: { testValue: 1 } } }
  ), { _id: 'key_1', data: 'test', values: [1, 2, 3], testValue: 1, newValue: { testValue: 1 } });

  t.end();
});

test('[modify] operator $push should add value to field', t => {
  t.deepEqual(modify(
    { a: 1 },
    { $push: { a: { b: 1 } } }
  ), { a: 1 });
  t.deepEqual(modify(
    { a: [1, 2] },
    { $push: { a: { d: 4 } } }
  ), { a: [1, 2, { d: 4 }] });

  t.end();
});
