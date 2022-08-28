const test = require('tape');

const { mockObjectSimple } = require('../_utils');
const Memory = require('../../build/memory').default;

test('[memory.set] sets document', t => {
  const memory = new Memory();

  memory.set(mockObjectSimple);

  t.deepEqual(memory._docs.values().next().value, mockObjectSimple, 'sets doc');

  t.end();
});

test('[memory.set] indexes by `_id`', t => {
  const memory = new Memory();

  memory.set(mockObjectSimple);

  t.true(memory._docs.has(mockObjectSimple._id), 'indexes by _id');

  t.end();
});
