const test = require('tape');

const { docModify } = require('../../build/modifiers');

// Utils
const { invalidNumberOperator } = require('../_utils');

test('[docModify] operator $add should increase field with value', t => {
  t.strictEqual(docModify(
    { a: 1 },
    { $add: { a: 2 } }
  ).a, 3);
  t.strictEqual(docModify(
    { a: 1 },
    { $add: { a: '2' } }
  ).a, 1);
  t.strictEqual(docModify(
    { a: 1 },
    { $add: { a: -2 } }
  ).a, -1);
  t.false(docModify(
    { a: 1 },
    { $add: { b: 2 } }
  ).b);
  t.strictEqual(docModify(
    { a: { b: 1 } },
    { $add: { 'a.b': 2 } }
  ).a.b, 3);
  t.strictEqual(docModify(
    { a: { b: [{ c: 1 }] } },
    { $add: { 'a.b.0.c': 2 } }
  ).a.b[0].c, 3);

  t.end();
});

test('[docModify] operator $add should return unmodified value if field is not a number', t => {
  t.deepEqual(docModify({ a: '1' }, { $add: { a: 1 } }), { a: '1' });

  t.end();
});

test('[docModify] operator $add should return unmodifier value if value is not a number', t => {
  for (let i = 0; i < invalidNumberOperator; i += 1) {
    try {
      docModify({ a: 1 }, { $add: { a: invalidNumberOperator[i] } });
      t.pass(`throws: ${i}`);
    } catch (err) {
      t.fail(err);
    }
  }

  t.end();
});

test('[docModify] operator $set should set field with value', t => {
  t.deepEqual(docModify(
    { a: 1 },
    { $set: { a: { b: 1 } } }
  ), { a: { b: 1 } });
  t.deepEqual(docModify(
    { a: { c: 1 } },
    { $set: { a: { b: 1 } } }
  ), { a: { b: 1 } });
  t.deepEqual(docModify(
    { a: { b: 1 } },
    { $set: { 'a.b': { c: 1 } } }
  ), { a: { b: { c: 1 } } });
  t.deepEqual(docModify(
    { a: { b: [{ c: 1 }] } },
    { $set: { 'a.b.0.c': { d: 1 } } }
  ), { a: { b: [{ c: { d: 1 } }] } });

  t.end();
});

test('[docModify] operator $push should add value to field', t => {
  t.deepEqual(docModify(
    { a: 1 },
    { $push: { a: { b: 1 } } }
  ), { a: 1 });
  t.deepEqual(docModify(
    { a: [] },
    { $push: { a: 1 } }
  ), { a: [1] });
  t.deepEqual(docModify(
    { a: [1, 2] },
    { $push: { a: 1 } }
  ), { a: [1, 2, 1] });
  t.deepEqual(docModify(
    { a: [1, 2] },
    { $push: { a: { d: 4 } } }
  ), { a: [1, 2, { d: 4 }] });

  t.end();
});
