const { assert } = require('chai');

const {
  isQueryMatch,
  isInvalidDoc,
  hasMixedModifiers
} = require('../src/validation');

// Testing objects
const objectSimple = {
  _id: 1,
  a: 1,
  b: 'string',
  c: null,
  d: false
};

const objectNested = {
  _id: 1,
  a: 1,
  b: {
    c: 'string'
  },
  d: {
    f: {
      g: true,
      h: {
        i: null
      }
    },
    j: 2
  }
};

const objectComplex = {
  _id: 1,
  a: 1,
  b: [2, null, 3],
  c: [
    {
      d: 'string',
      e: {
        f: null
      }
    },
    {
      g: true,
      h: 'string',
      i: {
        j: [4, null]
      }
    }
  ]
};

describe('Validation', () => {
  describe('hasMixedModifiers()', () => {
    it('should return false if object does not have mixed modifiers', () => {
      assert.isFalse(hasMixedModifiers({ a: 1 }));
      assert.isFalse(hasMixedModifiers({ $a: 1 }));
      assert.isFalse(hasMixedModifiers({ a: 1, b: 1 }));
      assert.isFalse(hasMixedModifiers({ $a: 1, $b: 1 }));
    });

    it('should return true if object has mixed modifiers', () => {
      assert.isTrue(hasMixedModifiers({ a: 1, $b: 1 }));
    });
  });

  describe('isInvalidDoc', () => {
    it('should return true if doc is invalid', () => {
      assert.isTrue(isInvalidDoc({ _id: undefined }));
      assert.isTrue(isInvalidDoc({ $field: 2 }));
      assert.isTrue(isInvalidDoc({ 'test.field': 2 }));
      assert.isTrue(isInvalidDoc({ _id: { a: undefined } }));
      assert.isTrue(isInvalidDoc({ a: { $field: 2 } }));
      assert.isTrue(isInvalidDoc({ a: { 'test.field': 2 } }));
      assert.isTrue(isInvalidDoc({ _id: [{ a: undefined }] }));
      assert.isTrue(isInvalidDoc({ a: [{ $field: 2 }] }));
      assert.isTrue(isInvalidDoc({ a: [{ 'test.field': 2 }] }));
      assert.isTrue(isInvalidDoc({ _id: 1, a: { b: [{ c: [undefined] }] } }));

      assert.isFalse(isInvalidDoc({}));
      assert.isFalse(isInvalidDoc({ a: null }));
      assert.isFalse(isInvalidDoc({ a: [null] }));
      assert.isFalse(isInvalidDoc({ date: '2010.09.31' }));
      assert.isFalse(isInvalidDoc({ date: {} }));
      assert.isFalse(isInvalidDoc({ a: '反復回転時計' }));
      assert.isFalse(isInvalidDoc({ a: 'a\\null\\undefined' }));
      assert.isFalse(isInvalidDoc({
        file: 'D:/debug/[bracket]/123/da-sh/under_score.mp3',
        format: {
          tagTypes: [],
          lossless: false,
          container: 'MPEG',
          codec: 'MPEG 1 Layer 3',
          sampleRate: 44100,
          tool: 'LAME3.98r',
          duration: 171.04979591836735
        },
        metadata: {
          titlelocalized: null,
          cdid: [null],
          date: '2012-08-31T16:09:24',
          copyright: 'Creative Commons Attribution: http://creativecommons.org/licenses/by/3.0/',
          comment: [
            'URL: http://freemusicarchive.org/music/Tours/Enthusiast/Tours_-_Enthusiast\r\nComments: http://freemusicarchive.org/\r\nCurator: \r\nCopyright: Creative Commons Attribution: http://creativecommons.org/licenses/by/3.0/'
          ],
        }
      }));
    });
  });

  describe('isQueryMatch()', () => {
    it('should return true on empty query', () => {
      assert.isTrue(isQueryMatch(objectSimple, {}));
      assert.isTrue(isQueryMatch(objectNested, {}));
      assert.isTrue(isQueryMatch(objectComplex, {}));
    });

    it('should return true if query matches', () => {
      // Test all data types
      assert.isTrue(isQueryMatch(objectSimple, { _id: 1 }));
      assert.isTrue(isQueryMatch(objectSimple, { b: 'string' }));
      assert.isTrue(isQueryMatch(objectSimple, { c: null }));
      assert.isTrue(isQueryMatch(objectSimple, { d: false }));
      // Test nesting
      assert.isTrue(isQueryMatch(objectNested, { b: { c: 'string' } }));
      assert.isTrue(isQueryMatch(
        objectNested,
        { d: { f: { g: true, h: { i: null } }, j: 2 } }
      ));
      // Test dot
      assert.isTrue(isQueryMatch(objectComplex, { 'b.0': 2 }));
      assert.isTrue(isQueryMatch(objectComplex, { 'b[1]': null }));
      assert.isTrue(isQueryMatch(objectComplex, { 'c.0.d': 'string' }));
      // Test multi match
      assert.isTrue(isQueryMatch(objectSimple, { _id: 1, c: null }));
      assert.isTrue(isQueryMatch(objectNested, { _id: 1, 'b.c': 'string' }));
      assert.isTrue(isQueryMatch(objectComplex, { _id: 1, 'c.1.i.j.0': 4 }));
    });

    it('should return false if query does not match', () => {
      // Test all data types
      assert.isFalse(isQueryMatch(objectSimple, { _id: 2 }));
      assert.isFalse(isQueryMatch(objectSimple, { _id: '1' }));
      assert.isFalse(isQueryMatch(objectSimple, { b: '' }));
      assert.isFalse(isQueryMatch(objectSimple, { c: false }));
      assert.isFalse(isQueryMatch(objectSimple, { d: null }));
      // Test nesting
      assert.isFalse(isQueryMatch(objectNested, { d: { j: 2 } }));
      assert.isFalse(isQueryMatch(objectComplex, { b: [2, false, 3] }));
      assert.isFalse(isQueryMatch(objectComplex, { b: [null, 2, 3] }));
      assert.isFalse(isQueryMatch(objectComplex, { b: [2, null] }));
      assert.isFalse(isQueryMatch(objectComplex, { c: [{ d: 'string' }, { g: true }] }));
      // Test multi match
      assert.isFalse(isQueryMatch(objectSimple, { _id: 2, c: null }));
      assert.isFalse(isQueryMatch(objectNested, { _id: 2, 'b.c': 'string' }));
      assert.isFalse(isQueryMatch(objectComplex, { _id: 2, 'c.1.i.j.0': 4 }));
    });

    describe('$gt', () => {
      it('should return true if field is greater than value', () => {
        assert.isTrue(isQueryMatch(objectSimple, { $gt: { a: 0 } }));
        assert.isTrue(isQueryMatch(objectNested, { $gt: { 'd.j': 1 } }));
        assert.isTrue(isQueryMatch(objectComplex, { $gt: { 'c.1.i.j.0': 3 } }));
      });

      it('should return false if field is not greater than value', () => {
        // Test numbers
        assert.isFalse(isQueryMatch(objectSimple, { $gt: { a: 1 } }));
        assert.isFalse(isQueryMatch(objectNested, { $gt: { 'd.j': 2 } }));
        assert.isFalse(isQueryMatch(objectComplex, { $gt: { 'c.1.i.j.0': 4 } }));
        // Test data types
        assert.isFalse(isQueryMatch(objectSimple, { $gt: { a: '0' } }));
        assert.isFalse(isQueryMatch(objectSimple, { $gt: { a: null } }));
        assert.isFalse(isQueryMatch(objectSimple, { $gt: { a: false } }));
        assert.isFalse(isQueryMatch(objectSimple, { $gt: { a: {} } }));
      });
    });

    describe('$gte', () => {
      it('should return true if field is greater than or equal to value', () => {
        assert.isTrue(isQueryMatch(objectSimple, { $gte: { a: 1 } }));
        assert.isTrue(isQueryMatch(objectNested, { $gte: { 'd.j': 2 } }));
        assert.isTrue(isQueryMatch(objectComplex, { $gte: { 'c.1.i.j.0': 4 } }));
      });

      it('should return false if field is not greater than or equal to value', () => {
        // Test numbers
        assert.isFalse(isQueryMatch(objectSimple, { $gte: { a: 2 } }));
        assert.isFalse(isQueryMatch(objectNested, { $gte: { 'd.j': 3 } }));
        assert.isFalse(isQueryMatch(objectComplex, { $gte: { 'c.1.i.j.0': 5 } }));
        // Test data types
        assert.isFalse(isQueryMatch(objectSimple, { $gte: { a: '1' } }));
        assert.isFalse(isQueryMatch(objectSimple, { $gte: { a: null } }));
        assert.isFalse(isQueryMatch(objectSimple, { $gte: { a: false } }));
        assert.isFalse(isQueryMatch(objectSimple, { $gte: { a: {} } }));
      });
    });

    describe('$lt', () => {
      it('should return true if field is less than value', () => {
        assert.isTrue(isQueryMatch(objectSimple, { $lt: { a: 2 } }));
        assert.isTrue(isQueryMatch(objectNested, { $lt: { 'd.j': 3 } }));
        assert.isTrue(isQueryMatch(objectComplex, { $lt: { 'c.1.i.j.0': 5 } }));
      });

      it('should return false if field is not less than value', () => {
        // Test numbers
        assert.isFalse(isQueryMatch(objectSimple, { $lt: { a: 1 } }));
        assert.isFalse(isQueryMatch(objectNested, { $lt: { 'd.j': 2 } }));
        assert.isFalse(isQueryMatch(objectComplex, { $lt: { 'c.1.i.j.0': 4 } }));
        // Test data types
        assert.isFalse(isQueryMatch(objectSimple, { $lt: { a: '0' } }));
        assert.isFalse(isQueryMatch(objectSimple, { $lt: { a: null } }));
        assert.isFalse(isQueryMatch(objectSimple, { $lt: { a: false } }));
        assert.isFalse(isQueryMatch(objectSimple, { $lt: { a: {} } }));
      });
    });

    describe('$lte', () => {
      it('should return true if field is less than or equal to value', () => {
        assert.isTrue(isQueryMatch(objectSimple, { $lte: { a: 1 } }));
        assert.isTrue(isQueryMatch(objectNested, { $lte: { 'd.j': 2 } }));
        assert.isTrue(isQueryMatch(objectComplex, { $lte: { 'c.1.i.j.0': 4 } }));
      });

      it('should return false if field is not less than or equal to value', () => {
        // Test numbers
        assert.isFalse(isQueryMatch(objectSimple, { $lte: { a: 0 } }));
        assert.isFalse(isQueryMatch(objectNested, { $lte: { 'd.j': 1 } }));
        assert.isFalse(isQueryMatch(objectComplex, { $lte: { 'c.1.i.j.0': 3 } }));
        // Test data types
        assert.isFalse(isQueryMatch(objectSimple, { $lte: { a: '1' } }));
        assert.isFalse(isQueryMatch(objectSimple, { $lte: { a: null } }));
        assert.isFalse(isQueryMatch(objectSimple, { $lte: { a: false } }));
        assert.isFalse(isQueryMatch(objectSimple, { $lte: { a: {} } }));
      });
    });

    describe('$ne', () => {
      assert.isTrue(isQueryMatch(objectSimple, { $ne: { a: 0 } }));
      assert.isTrue(isQueryMatch(objectNested, { $ne: { 'b.c': undefined } }));
      assert.isTrue(isQueryMatch(objectComplex, { $ne: { 'c.0.e.f': true } }));

      assert.isFalse(isQueryMatch(objectSimple, { $ne: { a: 1 } }));
      assert.isFalse(isQueryMatch(objectNested, { $ne: { 'b.c': 'string' } }));
      assert.isFalse(isQueryMatch(objectComplex, { $ne: { 'c.0.e.f': null } }));
    });

    describe('$exists', () => {
      it('should return true if field exists', () => {
        // Test all data types
        assert.isTrue(isQueryMatch(objectSimple, { $exists: 'a' }));
        assert.isTrue(isQueryMatch(objectSimple, { $exists: 'b' }));
        assert.isTrue(isQueryMatch(objectSimple, { $exists: 'c' }));
        assert.isTrue(isQueryMatch(objectSimple, { $exists: 'd' }));
        // Test nesting
        assert.isTrue(isQueryMatch(objectNested, { $exists: 'd.j' }));
        assert.isTrue(isQueryMatch(objectComplex, { $exists: 'c.1.i.j.0' }));
        // Multi field
        assert.isTrue(isQueryMatch(objectComplex, { $exists: ['a', 'b.0', 'c.1.i.j'] }));
      });

      it('should return false is field does not exist', () => {
        assert.isFalse(isQueryMatch(objectSimple, { $exists: 'e' }));
        assert.isFalse(isQueryMatch(objectNested, { $exists: 'd.c.b' }));
        assert.isFalse(isQueryMatch(objectComplex, { $exists: 'b.-1' }));
      });
    });

    describe('$has', () => {
      it('should return true if field contains value', () => {
        assert.isTrue(isQueryMatch(objectComplex, { $has: { b: 2 } }));
        assert.isTrue(isQueryMatch(objectComplex, { $has: { b: null } }));
        assert.isTrue(isQueryMatch(objectComplex, { $has: { c: { d: 'string', e: { f: null } } } }));
        assert.isTrue(isQueryMatch(objectComplex, { $has: { 'c.1.i.j': 4 } }));
      });

      it('should return false if field does not contain value', () => {
        assert.isFalse(isQueryMatch(objectComplex, { $has: { b: 4 } }));
        assert.isFalse(isQueryMatch(objectComplex, { $has: { b: [] } }));
        assert.isFalse(isQueryMatch(objectComplex, { $has: { c: { d: 'string' } } }));
      });
    });

    describe('$some', () => {
      it('should return true if any field matches', () => {
        assert.isTrue(isQueryMatch(objectSimple, { $some: { _id: 1, a: 1 } }));
        assert.isTrue(isQueryMatch(objectNested, { $some: { 'b.c': 'string', a: 2 } }));
        assert.isTrue(isQueryMatch(objectComplex, { $some: { a: 0, 'b.0': 2, 'c.0.d': 'string' } }));
      });

      it('should return false if no field matches', () => {
        assert.isFalse(isQueryMatch(objectSimple, { $some: { _id: 2, a: false } }));
        assert.isFalse(isQueryMatch(objectNested, { $some: { 'b.c': 'false', a: 3 } }));
        assert.isFalse(isQueryMatch(objectComplex, { $some: { a: null, 'b.0': 'false', 'c.0.d': 3 } }));
      });
    });
  });
});
