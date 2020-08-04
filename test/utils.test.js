const { assert } = require('chai');

const {
  getUid,
  objectHas,
  objectModify
} = require('../src/utils');

describe('Utils', () => {
  describe('getUid()', () => {
    it('should return unique IDs', () => {
      assert.isString(getUid());

      const size = 10000; // Larger size takes too long
      const array = [];

      for (let i = 0; i < size; i += 1) {
        array.push(getUid());
      }

      assert.strictEqual(new Set(array).size, size);
    });
  });

  describe('objectHas()', () => {
    it('should return true if object has key or value, at any depth', () => {
      assert.isTrue(objectHas({ a: 1 }, ({ key }) => key === 'a'));
      assert.isFalse(objectHas({ a: 1 }, ({ key }) => key === 'b'));
      assert.isTrue(objectHas({ a: 1 }, ({ value }) => value === 1));
      assert.isFalse(objectHas({ a: 1 }, ({ value }) => value === 2));
      assert.isTrue(objectHas({ a: { b: 1 } }, ({ key }) => key === 'b'));
      assert.isTrue(objectHas({ a: { b: 1 } }, ({ value }) => value === 1));
      assert.isTrue(objectHas({ a: { b: [{ c: 1 }] } }, ({ key }) => key === 'c'));
      assert.isTrue(objectHas({ a: { b: [{ c: 1 }] } }, ({ value }) => value === 1));
    });
  });

  describe('objectModify()', () => {
    it('should throw an error if invalid modifier is provided', () => {
      assert.throws(() => objectModify({ a: 1 }, { $mocha: { a: 1 } }));
    });

    describe('Modifiers', () => {
      it('$inc', () => {
        assert.strictEqual(objectModify(
          { a: 1 },
          { $inc: { a: 2 } }
        ).a, 3);
        assert.strictEqual(objectModify(
          { a: 1 },
          { $inc: { a: -2 } }
        ).a, -1);
        assert.doesNotHaveAnyKeys(objectModify(
          { a: 1 },
          { $inc: { b: 2 } }
        ), 'b');
        assert.strictEqual(objectModify(
          { a: { b: 1 } },
          { $inc: { 'a.b': 2 } }
        ).a.b, 3);
        assert.strictEqual(objectModify(
          { a: { b: [{ c: 1 }] } },
          { $inc: { 'a.b.0.c': 2 } }
        ).a.b[0].c, 3);
      });

      it('$set', () => {
        assert.hasAllKeys(objectModify(
          { a: 1 },
          { $set: { a: { b: 1 } } }
        ), { a: { b: 1 } });
        assert.hasAllKeys(objectModify(
          { a: { c: 1 } },
          { $set: { a: { b: 1 } } }
        ), { a: { b: 1 } });
        assert.hasAllKeys(objectModify(
          { a: { b: 1 } },
          { $set: { 'a.b': { c: 1 } } }
        ), { a: { b: { c: 1 } } });
        assert.hasAllKeys(objectModify(
          { a: { b: [{ c: 1 }] } },
          { $set: { 'a.b.0.c': { d: 1 } } }
        ), { a: { b: [{ c: { d: 1 } }] } });
      });
    });
  });
});
