const test = require('tape');

const { isDocStrict } = require('../../build/validation');

test('[isDocStrict] should return false if doc is invalid', t => {
  t.false(isDocStrict({ _id: undefined }, true), '_id undefined');
  t.false(isDocStrict({ _id: { a: undefined } }, true), '_id object');
  t.false(isDocStrict({ _id: [{ a: undefined }] }, true), '_id array');

  t.end();
});

test('[isDocStrict] should return true is doc is valid', t => {
  t.true(isDocStrict({ _id: '3' }));

  t.end();
});
