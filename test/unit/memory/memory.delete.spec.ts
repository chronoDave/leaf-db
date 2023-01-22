import test from 'tape';

import Memory from '../../../src/memory';
import { data } from './fixture';

test('[memory.delete] should delete document', t => {
  const memory = new Memory();
  // @ts-expect-error: Access private
  memory._docs.set(data._id, data);

  t.true(memory.delete(data._id), 'deletes doc');
  // @ts-expect-error: Access private
  t.false(memory._docs.has(data._id), 'doc does not exist');

  t.end();
});

test('[memory.delete] should return false if doc does not exist', t => {
  const memory = new Memory();

  t.false(memory.delete(data._id));

  t.end();
});
