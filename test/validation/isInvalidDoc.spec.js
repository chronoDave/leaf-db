const test = require('tape');

// Utils
const { mockObjectProduction } = require('../_utils');

const { isInvalidDoc } = require('../../src/validation');

test('[isInvalidDoc] should return true if doc is invalid', t => {
  t.ok(isInvalidDoc({ _id: undefined }));
  t.ok(isInvalidDoc({ $field: 2 }));
  t.ok(isInvalidDoc({ 'test.field': 2 }));
  t.ok(isInvalidDoc({ _id: { a: undefined } }));
  t.ok(isInvalidDoc({ a: { $field: 2 } }));
  t.ok(isInvalidDoc({ a: { 'test.field': 2 } }));
  t.ok(isInvalidDoc({ _id: [{ a: undefined }] }));
  t.ok(isInvalidDoc({ a: [{ $field: 2 }] }));
  t.ok(isInvalidDoc({ a: [{ 'test.field': 2 }] }));
  t.ok(isInvalidDoc({ _id: 1, a: { b: [{ c: [undefined] }] } }));

  t.end();
});

test('[isInvalidDoc] should return false is doc is valid', t => {
  t.notOk(isInvalidDoc({}));
  t.notOk(isInvalidDoc({ a: null }));
  t.notOk(isInvalidDoc({ a: [null] }));
  t.notOk(isInvalidDoc({ date: '2010.09.31' }));
  t.notOk(isInvalidDoc({ date: {} }));
  t.notOk(isInvalidDoc({ a: '反復回転時計' }));
  t.notOk(isInvalidDoc({ a: 'a\\null\\undefined' }));
  t.notOk(isInvalidDoc(mockObjectProduction));

  t.end();
});
