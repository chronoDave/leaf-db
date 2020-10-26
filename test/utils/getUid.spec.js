const test = require('tape');

const { getUid } = require('../../dist/utils');

test('[getUid] should return unique ids', t => {
  t.true(typeof getUid() === 'string');

  const size = 100000;
  const actual = [];

  for (let i = 0; i < size; i += 1) {
    actual.push(getUid());
  }

  t.strictEqual(new Set(actual).size, size);

  t.end();
});
