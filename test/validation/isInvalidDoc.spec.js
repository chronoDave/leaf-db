const test = require('tape');

const { isInvalidDoc } = require('../../dist/validation');

// Utils
const { mockObjectProduction } = require('../_utils');

test('[isInvalidDoc] should return true if doc is invalid', t => {
  t.true(isInvalidDoc({ _id: undefined }));
  t.true(isInvalidDoc({ $field: 2 }));
  t.true(isInvalidDoc({ 'test.field': 2 }));
  t.true(isInvalidDoc({ _id: { a: undefined } }));
  t.true(isInvalidDoc({ a: { $field: 2 } }));
  t.true(isInvalidDoc({ a: { 'test.field': 2 } }));
  t.true(isInvalidDoc({ _id: [{ a: undefined }] }));
  t.true(isInvalidDoc({ a: [{ $field: 2 }] }));
  t.true(isInvalidDoc({ a: [{ 'test.field': 2 }] }));
  t.true(isInvalidDoc({ _id: 1, a: { b: [{ c: [undefined] }] } }));

  t.end();
});

test('[isInvalidDoc] should return false is doc is valid', t => {
  t.false(isInvalidDoc({}));
  t.false(isInvalidDoc({ a: null }));
  t.false(isInvalidDoc({ a: [null] }));
  t.false(isInvalidDoc({ date: '2010.09.31' }));
  t.false(isInvalidDoc({ date: {} }));
  t.false(isInvalidDoc({ a: '反復回転時計' }));
  t.false(isInvalidDoc({ a: 'a\\null\\undefined' }));
  t.false(isInvalidDoc(mockObjectProduction));

  t.end();
});
