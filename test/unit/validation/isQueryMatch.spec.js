const test = require('tape');

const { isQueryMatch } = require('../../build/validation');

// Utils
const { mockObjectSimple, mockObjectNested, mockObjectComplex } = require('../_utils');

test('[isQueryMatch] should return true on empty query', t => {
  t.true(isQueryMatch(mockObjectSimple, {}));
  t.true(isQueryMatch(mockObjectNested, {}));
  t.true(isQueryMatch(mockObjectComplex, {}));

  t.end();
});

test('[isQueryMatch] should return true if query matches', t => {
  // Test all data types
  t.true(isQueryMatch(mockObjectSimple, { _id: 1 }));
  t.true(isQueryMatch(mockObjectSimple, { b: 'string' }));
  t.true(isQueryMatch(mockObjectSimple, { c: null }));
  t.true(isQueryMatch(mockObjectSimple, { d: false }));
  // Test nesting
  t.true(isQueryMatch(mockObjectNested, { b: { c: 'string' } }));
  t.true(isQueryMatch(mockObjectNested, { d: { f: { g: true, h: { i: null } }, j: 2 } }));
  // Test dot
  t.true(isQueryMatch(mockObjectComplex, { 'b.0': 2 }));
  t.true(isQueryMatch(mockObjectComplex, { 'c.0.d': 'String' }));
  // Test multi match
  t.true(isQueryMatch(mockObjectSimple, { _id: 1, c: null }));
  t.true(isQueryMatch(mockObjectNested, { _id: 1, 'b.c': 'string' }));
  t.true(isQueryMatch(mockObjectComplex, { _id: 1, 'c.1.i.j.0': 4 }));

  t.end();
});

test('[isQueryMatch] should return false if query matches', t => {
  // Test all data types
  t.false(isQueryMatch(mockObjectSimple, { _id: 2 }));
  t.false(isQueryMatch(mockObjectSimple, { _id: '1' }));
  t.false(isQueryMatch(mockObjectSimple, { b: '' }));
  t.false(isQueryMatch(mockObjectSimple, { c: false }));
  t.false(isQueryMatch(mockObjectSimple, { d: null }));
  // Test nesting
  t.false(isQueryMatch(mockObjectNested, { d: { j: 2 } }));
  t.false(isQueryMatch(mockObjectComplex, { b: [2, false, 3] }));
  t.false(isQueryMatch(mockObjectComplex, { b: [null, 2, 3] }));
  t.false(isQueryMatch(mockObjectComplex, { b: [2, null] }));
  t.false(isQueryMatch(mockObjectComplex, { c: [{ d: 'string' }, { g: true }] }));
  // Test multi match
  t.false(isQueryMatch(mockObjectSimple, { _id: 2, c: null }));
  t.false(isQueryMatch(mockObjectNested, { _id: 2, 'b.c': 'string' }));
  t.false(isQueryMatch(mockObjectComplex, { _id: 2, 'c.1.i.j.0': 4 }));

  t.end();
});

test('[isQueryMatch] operator $gt should return true if field is greater than value', t => {
  t.true(isQueryMatch(mockObjectSimple, { $gt: { a: 0 } }));
  t.true(isQueryMatch(mockObjectNested, { $gt: { 'd.j': 1 } }));
  t.true(isQueryMatch(mockObjectComplex, { $gt: { 'c.1.i.j.0': 3 } }));

  t.end();
});

test('[isQuerymatch] operator $gt should return false if field is not greater than value', t => {
  // Test numbers
  t.false(isQueryMatch(mockObjectSimple, { $gt: { a: 1 } }));
  t.false(isQueryMatch(mockObjectNested, { $gt: { 'd.j': 2 } }));
  t.false(isQueryMatch(mockObjectComplex, { $gt: { 'c.1.i.j.0': 4 } }));
  // Test data types
  t.false(isQueryMatch(mockObjectSimple, { $gt: { a: '0' } }));
  t.false(isQueryMatch(mockObjectSimple, { $gt: { a: null } }));
  t.false(isQueryMatch(mockObjectSimple, { $gt: { a: false } }));
  t.false(isQueryMatch(mockObjectSimple, { $gt: { a: {} } }));

  t.end();
});

test('[isQueryMatch] operator $gte should return true if field is greater than or equal to value', t => {
  t.true(isQueryMatch(mockObjectSimple, { $gte: { a: 1 } }));
  t.true(isQueryMatch(mockObjectNested, { $gte: { 'd.j': 2 } }));
  t.true(isQueryMatch(mockObjectComplex, { $gte: { 'c.1.i.j.0': 4 } }));

  t.end();
});

test('[isQueryMatch] operator $gte should return false if field is not greater than or equal to value', t => {
  // Test numbers
  t.false(isQueryMatch(mockObjectSimple, { $gte: { a: 2 } }));
  t.false(isQueryMatch(mockObjectNested, { $gte: { 'd.j': 3 } }));
  t.false(isQueryMatch(mockObjectComplex, { $gte: { 'c.1.i.j.0': 5 } }));
  // Test data types
  t.false(isQueryMatch(mockObjectSimple, { $gte: { a: '1' } }));
  t.false(isQueryMatch(mockObjectSimple, { $gte: { a: null } }));
  t.false(isQueryMatch(mockObjectSimple, { $gte: { a: false } }));
  t.false(isQueryMatch(mockObjectSimple, { $gte: { a: {} } }));

  t.end();
});

test('[isQueryMatch] operator $lt should return true if field is smaller than value', t => {
  t.true(isQueryMatch(mockObjectSimple, { $lt: { a: 2 } }));
  t.true(isQueryMatch(mockObjectNested, { $lt: { 'd.j': 3 } }));
  t.true(isQueryMatch(mockObjectComplex, { $lt: { 'c.1.i.j.0': 5 } }));

  t.end();
});

test('[isQueryMatch] operator $lt should return false if field is not smaller than value', t => {
  // Test numbers
  t.false(isQueryMatch(mockObjectSimple, { $lt: { a: 1 } }));
  t.false(isQueryMatch(mockObjectNested, { $lt: { 'd.j': 2 } }));
  t.false(isQueryMatch(mockObjectComplex, { $lt: { 'c.1.i.j.0': 4 } }));
  // Test data types
  t.false(isQueryMatch(mockObjectSimple, { $lt: { a: '0' } }));
  t.false(isQueryMatch(mockObjectSimple, { $lt: { a: null } }));
  t.false(isQueryMatch(mockObjectSimple, { $lt: { a: false } }));
  t.false(isQueryMatch(mockObjectSimple, { $lt: { a: {} } }));

  t.end();
});

test('[isQueryMatch] operator $lte should return true if field is smaller than or equal to value', t => {
  t.true(isQueryMatch(mockObjectSimple, { $lte: { a: 1 } }));
  t.true(isQueryMatch(mockObjectNested, { $lte: { 'd.j': 2 } }));
  t.true(isQueryMatch(mockObjectComplex, { $lte: { 'c.1.i.j.0': 4 } }));

  t.end();
});

test('[isQueryMatch] operator $lte should return false if value is not less than or equal to value', t => {
  // Test numbers
  t.false(isQueryMatch(mockObjectSimple, { $lte: { a: 0 } }));
  t.false(isQueryMatch(mockObjectNested, { $lte: { 'd.j': 1 } }));
  t.false(isQueryMatch(mockObjectComplex, { $lte: { 'c.1.i.j.0': 3 } }));
  // Test data types
  t.false(isQueryMatch(mockObjectSimple, { $lte: { a: '1' } }));
  t.false(isQueryMatch(mockObjectSimple, { $lte: { a: null } }));
  t.false(isQueryMatch(mockObjectSimple, { $lte: { a: false } }));
  t.false(isQueryMatch(mockObjectSimple, { $lte: { a: {} } }));

  t.end();
});

test('[isQueryMatch] operator $not should return true if field is not equal to value', t => {
  t.true(isQueryMatch(mockObjectSimple, { $not: { a: 0 } }));
  t.true(isQueryMatch(mockObjectNested, { $not: { 'b.c': undefined } }));
  t.true(isQueryMatch(mockObjectComplex, { $not: { 'c.0.e.f': true } }));

  t.end();
});

test('[isQueryMatch] operator $not should return false if field is equal to value', t => {
  t.false(isQueryMatch(mockObjectSimple, { $not: { a: 1 } }));
  t.false(isQueryMatch(mockObjectNested, { $not: { 'b.c': 'string' } }));
  t.false(isQueryMatch(mockObjectComplex, { $not: { 'c.0.e.f': null } }));

  t.end();
});

test('[isQueryMatch] operator $exists should return true if field exists', t => {
  // Test all data types
  t.true(isQueryMatch(mockObjectSimple, { $exists: 'a' }));
  t.true(isQueryMatch(mockObjectSimple, { $exists: 'b' }));
  t.true(isQueryMatch(mockObjectSimple, { $exists: 'c' }));
  t.true(isQueryMatch(mockObjectSimple, { $exists: 'd' }));
  // Test nesting
  t.true(isQueryMatch(mockObjectNested, { $exists: 'd.j' }));
  t.true(isQueryMatch(mockObjectComplex, { $exists: 'c.1.i.j.0' }));
  // Multi field
  t.true(isQueryMatch(mockObjectComplex, { $exists: ['a', 'b.0', 'c.1.i.j'] }));

  t.end();
});

test('[isQueryMatch] operator $exists should return false if field does not exist', t => {
  t.false(isQueryMatch(mockObjectSimple, { $exists: 'e' }));
  t.false(isQueryMatch(mockObjectNested, { $exists: 'd.c.b' }));
  t.false(isQueryMatch(mockObjectComplex, { $exists: 'b.-1' }));

  t.end();
});

test('[isQueryMatch] operator $has should return true if object contains value', t => {
  t.true(isQueryMatch(mockObjectComplex, { $has: { b: 2 } }));
  t.true(isQueryMatch(mockObjectComplex, { $has: { b: null } }));
  t.true(isQueryMatch(mockObjectComplex, { $has: { c: { d: 'String', e: { f: null } } } }));
  t.true(isQueryMatch(mockObjectComplex, { $has: { 'c.1.i.j': 4 } }));

  t.end();
});

test('[isQueryMatch] operator $has should return false if object does not contain value', t => {
  t.false(isQueryMatch(mockObjectComplex, { $has: { b: 4 } }));
  t.false(isQueryMatch(mockObjectComplex, { $has: { b: [] } }));
  t.false(isQueryMatch(mockObjectComplex, { $has: { c: { d: 'string' } } }));

  t.end();
});

test('[isQueryMatch] operator $some should return true if any query matches', t => {
  t.true(isQueryMatch(mockObjectComplex, {
    $some: [
      { b: 4 },
      { a: 2 },
      { c: 3 },
      { _id: 1 }
    ]
  }));
  t.true(isQueryMatch(mockObjectComplex, {
    $some: [
      { b: 4 },
      { a: 2 },
      { c: 3 },
      { $has: { b: 2 } }
    ]
  }));
  t.true(isQueryMatch(mockObjectComplex, {
    $some: [
      { b: 4 },
      { a: 1 },
      { c: 3 },
      { $has: { b: 2 } }
    ]
  }));

  t.end();
});

test('[isQueryMatch] operator $some should return false if no query matches', t => {
  t.false(isQueryMatch(mockObjectComplex, {
    $some: [
      { b: 4 },
      { a: 2 },
      { c: 3 },
      { _id: 5 }
    ]
  }));

  t.end();
});

test('[isQueryMatch] operator $stringStrict should return true if query partially matches', t => {
  t.true(isQueryMatch(mockObjectComplex, {
    $stringStrict: { 'c.0.d': 'Str' }
  }));

  t.end();
});

test('[isQueryMatch] operator $stringStrict should return false if query partially matches', t => {
  t.false(isQueryMatch(mockObjectComplex, {
    $stringStrict: { 'c.0.d': 'sng' }
  }));
  t.false(isQueryMatch(mockObjectComplex, {
    $stringStrict: { 'c.0.d': 'str' }
  }));

  t.end();
});

test('[isQueryMatch] operator $string should return true if query partially matches, case insensitive', t => {
  t.true(isQueryMatch(mockObjectComplex, {
    $string: { 'c.0.d': 'str' }
  }));
  t.true(isQueryMatch(mockObjectComplex, {
    $string: { 'c.0.d': 'Str' }
  }));

  t.end();
});

test('[isQueryMatch] operator $string should return false if query partially matches, case insensitive', t => {
  t.false(isQueryMatch(mockObjectComplex, {
    $string: { 'c.0.d': 'sng' }
  }));

  t.end();
});
