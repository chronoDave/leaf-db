const test = require('tape');

// Utils
const {
  mockObjectSimple,
  mockObjectNested,
  mockObjectComplex
} = require('../_utils');

const { isQueryMatch } = require('../../src/validation');

test('[isQueryMatch] should return true on empty query', t => {
  t.ok(isQueryMatch(mockObjectSimple, {}));
  t.ok(isQueryMatch(mockObjectNested, {}));
  t.ok(isQueryMatch(mockObjectComplex, {}));

  t.end();
});

test('[isQueryMatch] should return true if query matches', t => {
  // Test all data types
  t.ok(isQueryMatch(mockObjectSimple, { _id: 1 }));
  t.ok(isQueryMatch(mockObjectSimple, { b: 'string' }));
  t.ok(isQueryMatch(mockObjectSimple, { c: null }));
  t.ok(isQueryMatch(mockObjectSimple, { d: false }));
  // Test nesting
  t.ok(isQueryMatch(mockObjectNested, { b: { c: 'string' } }));
  t.ok(isQueryMatch(mockObjectNested, { d: { f: { g: true, h: { i: null } }, j: 2 } }));
  // Test dot
  t.ok(isQueryMatch(mockObjectComplex, { 'b.0': 2 }));
  t.ok(isQueryMatch(mockObjectComplex, { 'b[1]': null }));
  t.ok(isQueryMatch(mockObjectComplex, { 'c.0.d': 'string' }));
  // Test multi match
  t.ok(isQueryMatch(mockObjectSimple, { _id: 1, c: null }));
  t.ok(isQueryMatch(mockObjectNested, { _id: 1, 'b.c': 'string' }));
  t.ok(isQueryMatch(mockObjectComplex, { _id: 1, 'c.1.i.j.0': 4 }));

  t.end();
});

test('[isQueryMatch] should return false if query matches', t => {
  // Test all data types
  t.notOk(isQueryMatch(mockObjectSimple, { _id: 2 }));
  t.notOk(isQueryMatch(mockObjectSimple, { _id: '1' }));
  t.notOk(isQueryMatch(mockObjectSimple, { b: '' }));
  t.notOk(isQueryMatch(mockObjectSimple, { c: false }));
  t.notOk(isQueryMatch(mockObjectSimple, { d: null }));
  // Test nesting
  t.notOk(isQueryMatch(mockObjectNested, { d: { j: 2 } }));
  t.notOk(isQueryMatch(mockObjectComplex, { b: [2, false, 3] }));
  t.notOk(isQueryMatch(mockObjectComplex, { b: [null, 2, 3] }));
  t.notOk(isQueryMatch(mockObjectComplex, { b: [2, null] }));
  t.notOk(isQueryMatch(mockObjectComplex, { c: [{ d: 'string' }, { g: true }] }));
  // Test multi match
  t.notOk(isQueryMatch(mockObjectSimple, { _id: 2, c: null }));
  t.notOk(isQueryMatch(mockObjectNested, { _id: 2, 'b.c': 'string' }));
  t.notOk(isQueryMatch(mockObjectComplex, { _id: 2, 'c.1.i.j.0': 4 }));

  t.end();
});

test('[isQueryMatch] operator $gt should return true if field is greater than value', t => {
  t.ok(isQueryMatch(mockObjectSimple, { $gt: { a: 0 } }));
  t.ok(isQueryMatch(mockObjectNested, { $gt: { 'd.j': 1 } }));
  t.ok(isQueryMatch(mockObjectComplex, { $gt: { 'c.1.i.j.0': 3 } }));

  t.end();
});

test('[isQuerymatch] operator $gt should return false if field is not greater than value', t => {
  // Test numbers
  t.notOk(isQueryMatch(mockObjectSimple, { $gt: { a: 1 } }));
  t.notOk(isQueryMatch(mockObjectNested, { $gt: { 'd.j': 2 } }));
  t.notOk(isQueryMatch(mockObjectComplex, { $gt: { 'c.1.i.j.0': 4 } }));
  // Test data types
  t.notOk(isQueryMatch(mockObjectSimple, { $gt: { a: '0' } }));
  t.notOk(isQueryMatch(mockObjectSimple, { $gt: { a: null } }));
  t.notOk(isQueryMatch(mockObjectSimple, { $gt: { a: false } }));
  t.notOk(isQueryMatch(mockObjectSimple, { $gt: { a: {} } }));

  t.end();
});

test('[isQueryMatch] operator $gte should return true if field is greater than or equal to value', t => {
  t.ok(isQueryMatch(mockObjectSimple, { $gte: { a: 1 } }));
  t.ok(isQueryMatch(mockObjectNested, { $gte: { 'd.j': 2 } }));
  t.ok(isQueryMatch(mockObjectComplex, { $gte: { 'c.1.i.j.0': 4 } }));

  t.end();
});

test('[isQueryMatch] operator $gte should return false if field is not greater than or equal to value', t => {
  // Test numbers
  t.notOk(isQueryMatch(mockObjectSimple, { $gte: { a: 2 } }));
  t.notOk(isQueryMatch(mockObjectNested, { $gte: { 'd.j': 3 } }));
  t.notOk(isQueryMatch(mockObjectComplex, { $gte: { 'c.1.i.j.0': 5 } }));
  // Test data types
  t.notOk(isQueryMatch(mockObjectSimple, { $gte: { a: '1' } }));
  t.notOk(isQueryMatch(mockObjectSimple, { $gte: { a: null } }));
  t.notOk(isQueryMatch(mockObjectSimple, { $gte: { a: false } }));
  t.notOk(isQueryMatch(mockObjectSimple, { $gte: { a: {} } }));

  t.end();
});

test('[isQueryMatch] operator $lt should return true if field is smaller than value', t => {
  t.ok(isQueryMatch(mockObjectSimple, { $lt: { a: 2 } }));
  t.ok(isQueryMatch(mockObjectNested, { $lt: { 'd.j': 3 } }));
  t.ok(isQueryMatch(mockObjectComplex, { $lt: { 'c.1.i.j.0': 5 } }));

  t.end();
});

test('[isQueryMatch] operator $lt should return false if field is not smaller than value', t => {
  // Test numbers
  t.notOk(isQueryMatch(mockObjectSimple, { $lt: { a: 1 } }));
  t.notOk(isQueryMatch(mockObjectNested, { $lt: { 'd.j': 2 } }));
  t.notOk(isQueryMatch(mockObjectComplex, { $lt: { 'c.1.i.j.0': 4 } }));
  // Test data types
  t.notOk(isQueryMatch(mockObjectSimple, { $lt: { a: '0' } }));
  t.notOk(isQueryMatch(mockObjectSimple, { $lt: { a: null } }));
  t.notOk(isQueryMatch(mockObjectSimple, { $lt: { a: false } }));
  t.notOk(isQueryMatch(mockObjectSimple, { $lt: { a: {} } }));

  t.end();
});

test('[isQueryMatch] operator $lte should return true if field is smaller than or equal to value', t => {
  t.ok(isQueryMatch(mockObjectSimple, { $lte: { a: 1 } }));
  t.ok(isQueryMatch(mockObjectNested, { $lte: { 'd.j': 2 } }));
  t.ok(isQueryMatch(mockObjectComplex, { $lte: { 'c.1.i.j.0': 4 } }));

  t.end();
});

test('[isQueryMatch] operator $lte should return false if value is not less than or equal to value', t => {
  // Test numbers
  t.notOk(isQueryMatch(mockObjectSimple, { $lte: { a: 0 } }));
  t.notOk(isQueryMatch(mockObjectNested, { $lte: { 'd.j': 1 } }));
  t.notOk(isQueryMatch(mockObjectComplex, { $lte: { 'c.1.i.j.0': 3 } }));
  // Test data types
  t.notOk(isQueryMatch(mockObjectSimple, { $lte: { a: '1' } }));
  t.notOk(isQueryMatch(mockObjectSimple, { $lte: { a: null } }));
  t.notOk(isQueryMatch(mockObjectSimple, { $lte: { a: false } }));
  t.notOk(isQueryMatch(mockObjectSimple, { $lte: { a: {} } }));

  t.end();
});

test('[isQueryMatch] operator $not should return true if field is not equal to value', t => {
  t.ok(isQueryMatch(mockObjectSimple, { $not: { a: 0 } }));
  t.ok(isQueryMatch(mockObjectNested, { $not: { 'b.c': undefined } }));
  t.ok(isQueryMatch(mockObjectComplex, { $not: { 'c.0.e.f': true } }));

  t.end();
});

test('[isQueryMatch] operator $not should return false if field is equal to value', t => {
  t.notOk(isQueryMatch(mockObjectSimple, { $not: { a: 1 } }));
  t.notOk(isQueryMatch(mockObjectNested, { $not: { 'b.c': 'string' } }));
  t.notOk(isQueryMatch(mockObjectComplex, { $not: { 'c.0.e.f': null } }));

  t.end();
});

test('[isQueryMatch] operator $exists should return true if field exists', t => {
  // Test all data types
  t.ok(isQueryMatch(mockObjectSimple, { $exists: 'a' }));
  t.ok(isQueryMatch(mockObjectSimple, { $exists: 'b' }));
  t.ok(isQueryMatch(mockObjectSimple, { $exists: 'c' }));
  t.ok(isQueryMatch(mockObjectSimple, { $exists: 'd' }));
  // Test nesting
  t.ok(isQueryMatch(mockObjectNested, { $exists: 'd.j' }));
  t.ok(isQueryMatch(mockObjectComplex, { $exists: 'c.1.i.j.0' }));
  // Multi field
  t.ok(isQueryMatch(mockObjectComplex, { $exists: ['a', 'b.0', 'c.1.i.j'] }));

  t.end();
});

test('[isQueryMatch] operator $exists should return false if field does not exist', t => {
  t.notOk(isQueryMatch(mockObjectSimple, { $exists: 'e' }));
  t.notOk(isQueryMatch(mockObjectNested, { $exists: 'd.c.b' }));
  t.notOk(isQueryMatch(mockObjectComplex, { $exists: 'b.-1' }));

  t.end();
});

test('[isQueryMatch] operator $has should return true if object contains value', t => {
  t.ok(isQueryMatch(mockObjectComplex, { $has: { b: 2 } }));
  t.ok(isQueryMatch(mockObjectComplex, { $has: { b: null } }));
  t.ok(isQueryMatch(mockObjectComplex, { $has: { c: { d: 'string', e: { f: null } } } }));
  t.ok(isQueryMatch(mockObjectComplex, { $has: { 'c.1.i.j': 4 } }));

  t.end();
});

test('[isQueryMatch] oeprator $has should return false if object does not contain value', t => {
  t.notOk(isQueryMatch(mockObjectComplex, { $has: { b: 4 } }));
  t.notOk(isQueryMatch(mockObjectComplex, { $has: { b: [] } }));
  t.notOk(isQueryMatch(mockObjectComplex, { $has: { c: { d: 'string' } } }));

  t.end();
});
