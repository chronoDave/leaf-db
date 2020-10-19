const test = require('tape');

// Utils
const { invalidNumberOperator } = require('../_utils');

const { objectModify } = require('../../src/modifiers');

test('[objectModify] operator $add should increase field with value', t => {
  t.strictEqual(objectModify(
    { a: 1 },
    { $add: { a: 2 } }
  ).a, 3);
  t.strictEqual(objectModify(
    { a: 1 },
    { $add: { a: -2 } }
  ).a, -1);
  t.notOk(objectModify(
    { a: 1 },
    { $add: { b: 2 } }
  ).b);
  t.strictEqual(objectModify(
    { a: { b: 1 } },
    { $add: { 'a.b': 2 } }
  ).a.b, 3);
  t.strictEqual(objectModify(
    { a: { b: [{ c: 1 }] } },
    { $add: { 'a.b.0.c': 2 } }
  ).a.b[0].c, 3);

  t.end();
});

test('[objectModify] operator $add should return unmodified value if field is not a number', t => {
  t.deepEqual(objectModify({ a: '1' }, { $add: { a: 1 } }), { a: '1' });

  t.end();
});

test('[objectModify] operator $add should return unmodifier value if value is not a number', t => {
  for (let i = 0; i < invalidNumberOperator; i += 1) {
    try {
      objectModify({ a: 1 }, { $add: { a: invalidNumberOperator[i] } });
      t.pass(`throws: ${i}`);
    } catch (err) {
      t.fail(err);
    }
  }

  t.end();
});

test('[objectModify] operator $set should set field with value', t => {
  t.deepEqual(objectModify(
    { a: 1 },
    { $set: { a: { b: 1 } } }
  ), { a: { b: 1 } });
  t.deepEqual(objectModify(
    { a: { c: 1 } },
    { $set: { a: { b: 1 } } }
  ), { a: { b: 1 } });
  t.deepEqual(objectModify(
    { a: { b: 1 } },
    { $set: { 'a.b': { c: 1 } } }
  ), { a: { b: { c: 1 } } });
  t.deepEqual(objectModify(
    { a: { b: [{ c: 1 }] } },
    { $set: { 'a.b.0.c': { d: 1 } } }
  ), { a: { b: [{ c: { d: 1 } }] } });

  t.end();
});
