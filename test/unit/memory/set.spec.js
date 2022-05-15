const test = require('tape');

const { mockObjectSimple, mockObjectProduction } = require('../_utils');
const Memory = require('../../build/memory').default;

test('[set] should set document', t => {
  const memory = new Memory();

  memory.set(mockObjectSimple);

  t.deepEqual(memory._docs.values().next().value, mockObjectSimple);

  t.end();
});

test('[set] should index by `_id`', t => {
  const memory = new Memory();

  memory.set(mockObjectSimple);

  t.true(memory._docs.has(mockObjectSimple._id));

  t.end();
});

test('[set] should create `_id` if it does not exist', t => {
  const memory = new Memory();

  memory.set(mockObjectProduction);

  const { _id, doc } = memory._docs.values().next().value;
  t.notDeepEqual(doc, mockObjectProduction);
  t.true(typeof _id === 'string');

  t.end();
});
