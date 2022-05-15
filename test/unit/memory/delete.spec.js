const test = require('tape');

const { mockObjectSimple } = require('../_utils');
const Memory = require('../../build/memory').default;

test('[delete] should delete document', t => {
  const memory = new Memory();
  memory._docs.set(mockObjectSimple._id, mockObjectSimple);

  memory.delete(mockObjectSimple._id);

  t.false(memory._docs.has(mockObjectSimple._id));

  t.end();
});
