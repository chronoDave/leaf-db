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
  // Test multi match
  t.true(isQueryMatch(simple, { _id: '1', c: null }));
  t.true(isQueryMatch(nested, { _id: '1', b: { c: 'string' } }));

  t.end();
});

test('[isQueryMatch] should return false if query does not match', t => {
  // Test all data types
  t.false(isQueryMatch(simple, { b: '' }));
  // Test nesting
  t.false(isQueryMatch(complex, { b: [null, 2, 3] }));
  t.false(isQueryMatch(complex, { b: [2, null] }));
  // Test multi match
  t.false(isQueryMatch(simple, { _id: '2', c: null }));
  t.false(isQueryMatch(nested, { _id: '2', b: { c: 'string' } }));

  t.end();
});

test('[isQueryMatch] operator $gt should return true if field is greater than value', t => {
  t.true(isQueryMatch(simple, { a: { $gt: 0 } }));
  t.true(isQueryMatch(nested, { d: { j: { $gt: 1 } } }));

  t.end();
});

test('[isQuerymatch] operator $gt should return false if field is not greater than value', t => {
  t.false(isQueryMatch(simple, { a: { $gt: 1 } }));
  t.false(isQueryMatch(nested, { d: { j: { $gt: 2 } } }));

  t.end();
});

test('[isQueryMatch] operator $gte should return true if field is greater than or equal to value', t => {
  t.true(isQueryMatch(simple, { a: { $gte: 1 } }));
  t.true(isQueryMatch(nested, { d: { j: { $gte: 2 } } }));

  t.end();
});

test('[isQueryMatch] operator $gte should return false if field is not greater than or equal to value', t => {
  t.false(isQueryMatch(simple, { a: { $gte: 2 } }));
  t.false(isQueryMatch(nested, { d: { j: { $gte: 3 } } }));

  t.end();
});

test('[isQueryMatch] operator $lt should return true if field is smaller than value', t => {
  t.true(isQueryMatch(simple, { a: { $lt: 2 } }));
  t.true(isQueryMatch(nested, { d: { j: { $lt: 3 } } }));

  t.end();
});

test('[isQueryMatch] operator $lt should return false if field is not smaller than value', t => {
  t.false(isQueryMatch(simple, { a: { $lt: 1 } }));
  t.false(isQueryMatch(nested, { d: { j: { $lt: 2 } } }));

  t.end();
});

test('[isQueryMatch] operator $lte should return true if field is smaller than or equal to value', t => {
  t.true(isQueryMatch(simple, { a: { $lte: 1 } }));
  t.true(isQueryMatch(nested, { d: { j: { $lte: 2 } } }));

  t.end();
});

test('[isQueryMatch] operator $lte should return false if value is not less than or equal to value', t => {
  t.false(isQueryMatch(simple, { a: { $lte: 0 } }));
  t.false(isQueryMatch(nested, { d: { j: { $lte: 1 } } }));

  t.end();
});

test('[isQueryMatch] operator $not should return true if field is not equal to value', t => {
  t.true(isQueryMatch(simple, { a: { $not: 0 } }));
  t.true(isQueryMatch(nested, { b: { c: { $not: 'e' } } }));

  t.end();
});

test('[isQueryMatch] operator $not should return false if field is equal to value', t => {
  t.false(isQueryMatch(simple, { a: { $not: 1 } }));
  t.false(isQueryMatch(nested, { b: { c: { $not: 'string' } } }));

  t.end();
});

test('[isQueryMatch] operator $has should return true if object contains value', t => {
  t.true(isQueryMatch(complex, { b: { $has: 2 } }));
  t.true(isQueryMatch(complex, { b: { $has: null } }));
  t.true(isQueryMatch(complex, { c: { $has: { d: 'String', e: { f: null }, g: true, h: 'string', i: { j: [4, null] } } } }));

  t.end();
});

test('[isQueryMatch] operator $has should return false if object does not contain value', t => {
  t.false(isQueryMatch(complex, { b: { $has: 4 } }));
  t.false(isQueryMatch(complex, { b: { $has: [] } }));
  t.false(isQueryMatch(complex, { c: { $has: { d: 'string' } } }));

  t.end();
});

test('[isQueryMatch] operator $text should return true if query partially matches, case insensitive', t => {
  t.true(isQueryMatch(simple, { b: { $text: 'str' } }));
  t.true(isQueryMatch(simple, { b: { $text: 'Ing' } }));
  t.true(isQueryMatch(simple, { b: { $text: 'STRING' } }));

  t.end();
});

test('[isQueryMatch] operator $text should return false if query partially matches, case insensitive', t => {
  t.false(isQueryMatch(simple, { b: { $text: 'sstring' } }));
  t.false(isQueryMatch(simple, { b: { $text: 'stringg' } }));

  t.end();
});

test('[isQueryMatch] operator $regex should return true if query partially matches, case insensitive', t => {
  t.true(isQueryMatch(simple, { b: { $regex: /str/ } }));

  t.end();
});

test('[isQueryMatch] operator $regex should return false if query partially matches, case insensitive', t => {
  t.false(isQueryMatch(simple, { b: { $regex: /STRING/ } }));

  t.end();
});
