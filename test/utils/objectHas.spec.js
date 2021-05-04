const test = require('tape');

const { objectHas } = require('../build/utils');

test('[objectHas] should return true if object has key or value, at any depth', t => {
  t.true(objectHas({ a: 1 }, ({ key }) => key === 'a'));
  t.false(objectHas({ a: 1 }, ({ key }) => key === 'b'));
  t.true(objectHas({ a: 1 }, ({ value }) => value === 1));
  t.false(objectHas({ a: 1 }, ({ value }) => value === 2));
  t.true(objectHas({ a: { b: 1 } }, ({ key }) => key === 'b'));
  t.true(objectHas({ a: { b: 1 } }, ({ value }) => value === 1));
  t.true(objectHas({ a: { b: [{ c: 1 }] } }, ({ key }) => key === 'c'));
  t.true(objectHas({ a: { b: [{ c: 1 }] } }, ({ value }) => value === 1));

  t.end();
});

test('[objectHas] should only validate objects', t => {
  t.false(objectHas([], ({ key }) => key === 'a'));
  t.false(objectHas(null, ({ key }) => key === 'a'));
  t.false(objectHas(undefined, ({ key }) => key === 'a'));
  t.false(objectHas({ id: undefined }, ({ key }) => key === 'a'));
  t.false(objectHas({ id: [null] }, ({ key }) => key === 'a'));

  t.end();
});
