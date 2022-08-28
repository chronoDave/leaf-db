const test = require('tape');

const { mockObjectSimple } = require('../_utils');
const Memory = require('../../build/memory').default;

test('[memory.delete] should delete document', t => {
  const memory = new Memory();
  memory._docs.set(mockObjectSimple._id, mockObjectSimple);

  t.true(memory.delete(mockObjectSimple._id), 'deletes doc');
  t.false(memory._docs.has(mockObjectSimple._id), 'doc does not exist');

  t.end();
});

test('[memory.delete] should return false if doc does not exist', t => {
  const memory = new Memory();

  t.false(memory.delete(mockObjectSimple._id));

  t.end();
});
