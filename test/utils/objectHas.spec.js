const test = require('tape');

const { objectHas } = require('../../src/utils');

test('[objectHas] should return true if object has key or value, at any depth', t => {
  t.ok(objectHas({ a: 1 }, ({ key }) => key === 'a'));
  t.notOk(objectHas({ a: 1 }, ({ key }) => key === 'b'));
  t.ok(objectHas({ a: 1 }, ({ value }) => value === 1));
  t.notOk(objectHas({ a: 1 }, ({ value }) => value === 2));
  t.ok(objectHas({ a: { b: 1 } }, ({ key }) => key === 'b'));
  t.ok(objectHas({ a: { b: 1 } }, ({ value }) => value === 1));
  t.ok(objectHas({ a: { b: [{ c: 1 }] } }, ({ key }) => key === 'c'));
  t.ok(objectHas({ a: { b: [{ c: 1 }] } }, ({ value }) => value === 1));

  t.end();
});

test('[objectHas] should only validate objects', t => {
  t.notOk(objectHas([], ({ key }) => key === 'a'));
  t.notOk(objectHas(null, ({ key }) => key === 'a'));
  t.notOk(objectHas(undefined, ({ key }) => key === 'a'));
  t.notOk(objectHas({ id: undefined }, ({ key }) => key === 'a'));
  t.notOk(objectHas({ id: [null] }, ({ key }) => key === 'a'));

  t.end();
});
