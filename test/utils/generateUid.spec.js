const test = require('tape');

const { generateUid } = require('../../dist/utils');

test('[generateUid] should return unique ids', t => {
  t.true(typeof generateUid() === 'string');

  const size = 100000;
  const actual = [];

  for (let i = 0; i < size; i += 1) {
    actual.push(generateUid());
  }

  t.strictEqual(new Set(actual).size, size);

  t.end();
});
