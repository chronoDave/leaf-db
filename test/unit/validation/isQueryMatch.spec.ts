import test from 'tape';

import { isQueryMatch } from '../../../src/validation';
import { simple, nested, complex } from './fixture';

test('[isQueryMatch] should return true on empty query', t => {
  t.true(isQueryMatch(simple, {}));
  t.true(isQueryMatch(nested, {}));
  t.true(isQueryMatch(complex, {}));

  t.end();
});

test('[isQueryMatch] should return true if query matches', t => {
  // Test all data types
  t.true(isQueryMatch(simple, { _id: '1' }));
  t.true(isQueryMatch(simple, { b: 'string' }));
  t.true(isQueryMatch(simple, { c: null }));
  t.true(isQueryMatch(simple, { d: false }));
  // Test nesting
  t.true(isQueryMatch(nested, { b: { c: 'string' } }));
  t.true(isQueryMatch(nested, { d: { f: { g: true, h: { i: null } }, j: 2 } }));
  // Test dot
  t.true(isQueryMatch(complex, { 'b.0': 2 }));
  t.true(isQueryMatch(complex, { 'c.0.d': 'String' }));
  // Test multi match
  t.true(isQueryMatch(simple, { _id: '1', c: null }));
  t.true(isQueryMatch(nested, { _id: '1', 'b.c': 'string' }));
  t.true(isQueryMatch(complex, { _id: '1', 'c.1.i.j.0': 4 }));

  t.end();
});

test('[isQueryMatch] should return false if query matches', t => {
  // Test all data types
  t.false(isQueryMatch(simple, { _id: 1 }));
  t.false(isQueryMatch(simple, { b: '' }));
  t.false(isQueryMatch(simple, { c: false }));
  t.false(isQueryMatch(simple, { d: null }));
  // Test nesting
  t.false(isQueryMatch(nested, { d: { j: 2 } }));
  t.false(isQueryMatch(complex, { b: [2, false, 3] }));
  t.false(isQueryMatch(complex, { b: [null, 2, 3] }));
  t.false(isQueryMatch(complex, { b: [2, null] }));
  t.false(isQueryMatch(complex, { c: [{ d: 'string' }, { g: true }] }));
  // Test multi match
  t.false(isQueryMatch(simple, { _id: 2, c: null }));
  t.false(isQueryMatch(nested, { _id: 2, 'b.c': 'string' }));
  t.false(isQueryMatch(complex, { _id: 2, 'c.1.i.j.0': 4 }));

  t.end();
});

test('[isQueryMatch] operator $gt should return true if field is greater than value', t => {
  t.true(isQueryMatch(simple, { $gt: { a: 0 } }));
  t.true(isQueryMatch(nested, { $gt: { 'd.j': 1 } }));
  t.true(isQueryMatch(complex, { $gt: { 'c.1.i.j.0': 3 } }));

  t.end();
});

test('[isQuerymatch] operator $gt should return false if field is not greater than value', t => {
  t.false(isQueryMatch(simple, { $gt: { a: 1 } }));
  t.false(isQueryMatch(nested, { $gt: { 'd.j': 2 } }));
  t.false(isQueryMatch(complex, { $gt: { 'c.1.i.j.0': 4 } }));

  t.end();
});

test('[isQueryMatch] operator $gte should return true if field is greater than or equal to value', t => {
  t.true(isQueryMatch(simple, { $gte: { a: 1 } }));
  t.true(isQueryMatch(nested, { $gte: { 'd.j': 2 } }));
  t.true(isQueryMatch(complex, { $gte: { 'c.1.i.j.0': 4 } }));

  t.end();
});

test('[isQueryMatch] operator $gte should return false if field is not greater than or equal to value', t => {
  t.false(isQueryMatch(simple, { $gte: { a: 2 } }));
  t.false(isQueryMatch(nested, { $gte: { 'd.j': 3 } }));
  t.false(isQueryMatch(complex, { $gte: { 'c.1.i.j.0': 5 } }));

  t.end();
});

test('[isQueryMatch] operator $lt should return true if field is smaller than value', t => {
  t.true(isQueryMatch(simple, { $lt: { a: 2 } }));
  t.true(isQueryMatch(nested, { $lt: { 'd.j': 3 } }));
  t.true(isQueryMatch(complex, { $lt: { 'c.1.i.j.0': 5 } }));

  t.end();
});

test('[isQueryMatch] operator $lt should return false if field is not smaller than value', t => {
  t.false(isQueryMatch(simple, { $lt: { a: 1 } }));
  t.false(isQueryMatch(nested, { $lt: { 'd.j': 2 } }));
  t.false(isQueryMatch(complex, { $lt: { 'c.1.i.j.0': 4 } }));

  t.end();
});

test('[isQueryMatch] operator $lte should return true if field is smaller than or equal to value', t => {
  t.true(isQueryMatch(simple, { $lte: { a: 1 } }));
  t.true(isQueryMatch(nested, { $lte: { 'd.j': 2 } }));
  t.true(isQueryMatch(complex, { $lte: { 'c.1.i.j.0': 4 } }));

  t.end();
});

test('[isQueryMatch] operator $lte should return false if value is not less than or equal to value', t => {
  t.false(isQueryMatch(simple, { $lte: { a: 0 } }));
  t.false(isQueryMatch(nested, { $lte: { 'd.j': 1 } }));
  t.false(isQueryMatch(complex, { $lte: { 'c.1.i.j.0': 3 } }));

  t.end();
});

test('[isQueryMatch] operator $not should return true if field is not equal to value', t => {
  t.true(isQueryMatch(simple, { $not: { a: 0 } }));
  t.true(isQueryMatch(nested, { $not: { 'b.c': undefined } }));
  t.true(isQueryMatch(complex, { $not: { 'c.0.e.f': true } }));

  t.end();
});

test('[isQueryMatch] operator $not should return false if field is equal to value', t => {
  t.false(isQueryMatch(simple, { $not: { a: 1 } }));
  t.false(isQueryMatch(nested, { $not: { 'b.c': 'string' } }));
  t.false(isQueryMatch(complex, { $not: { 'c.0.e.f': null } }));

  t.end();
});

test('[isQueryMatch] operator $or should return true if a query matches', t => {
  t.true(isQueryMatch(simple, { $or: [{ a: 0 }, { a: 1 }] }));
  t.true(isQueryMatch(nested, { $or: [{ 'b.c': undefined }, { 'b.c': 'string' }] }));
  t.true(isQueryMatch(complex, { $or: [{ 'c.0.e.f': true }, { 'c.0.e.f': null }] }));

  t.end();
});

test('[isQueryMatch] operator $or should return false if no query matches', t => {
  t.false(isQueryMatch(simple, { $or: [{ a: 0 }, { c: false }] }));
  t.false(isQueryMatch(nested, { $or: [{ 'b.c': 3 }, { 'd.f': 'c' }] }));
  t.false(isQueryMatch(complex, { $or: [{ 'c.0.e.f': 3 }, { 'c.3': 6 }] }));

  t.end();
});

test('[isQueryMatch] operator $keys should return true if field exists', t => {
  // Test all data types
  t.true(isQueryMatch(simple, { $keys: ['a'] }));
  t.true(isQueryMatch(simple, { $keys: ['b'] }));
  t.true(isQueryMatch(simple, { $keys: ['c'] }));
  t.true(isQueryMatch(simple, { $keys: ['d'] }));
  // Test nesting
  t.true(isQueryMatch(nested, { $keys: ['d.j'] }));
  t.true(isQueryMatch(complex, { $keys: ['c.1.i.j.0'] }));
  // Multi field
  t.true(isQueryMatch(complex, { $keys: ['a', 'b.0', 'c.1.i.j'] }));

  t.end();
});

test('[isQueryMatch] operator $keys should return false if field does not exist', t => {
  t.false(isQueryMatch(simple, { $keys: ['e'] }));
  t.false(isQueryMatch(nested, { $keys: ['d.c.b'] }));
  t.false(isQueryMatch(complex, { $keys: ['b.-1'] }));

  t.end();
});

test('[isQueryMatch] operator $includes should return true if object contains value', t => {
  t.true(isQueryMatch(complex, { $includes: { b: 2 } }));
  t.true(isQueryMatch(complex, { $includes: { b: null } }));
  t.true(isQueryMatch(complex, { $includes: { c: { d: 'String', e: { f: null } } } }));
  t.true(isQueryMatch(complex, { $includes: { 'c.1.i.j': 4 } }));

  t.end();
});

test('[isQueryMatch] operator $includes should return false if object does not contain value', t => {
  t.false(isQueryMatch(complex, { $includes: { b: 4 } }));
  t.false(isQueryMatch(complex, { $includes: { b: [] } }));
  t.false(isQueryMatch(complex, { $includes: { c: { d: 'string' } } }));

  t.end();
});

test('[isQueryMatch] operator $stringStrict should return true if query partially matches', t => {
  t.true(isQueryMatch(complex, {
    $stringStrict: { 'c.0.d': 'Str' }
  }));

  t.end();
});

test('[isQueryMatch] operator $stringStrict should return false if query partially matches', t => {
  t.false(isQueryMatch(complex, {
    $stringStrict: { 'c.0.d': 'sng' }
  }));
  t.false(isQueryMatch(complex, {
    $stringStrict: { 'c.0.d': 'str' }
  }));

  t.end();
});

test('[isQueryMatch] operator $string should return true if query partially matches, case insensitive', t => {
  t.true(isQueryMatch(complex, {
    $string: { 'c.0.d': 'str' }
  }));
  t.true(isQueryMatch(complex, {
    $string: { 'c.0.d': 'Str' }
  }));

  t.end();
});

test('[isQueryMatch] operator $string should return false if query partially matches, case insensitive', t => {
  t.false(isQueryMatch(complex, {
    $string: { 'c.0.d': 'sng' }
  }));

  t.end();
});
