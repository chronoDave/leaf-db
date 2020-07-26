const { assert } = require('chai');

const {
  getUid,
  equalSome
} = require('./utils');

describe('utils', () => {
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

  describe('equalSome()', () => {
    it('should return true if some values match', () => {
      const a = { a: 1, b: 2 };
      const b = { b: 2, c: 3 };

      assert.isTrue(equalSome(a, b));
    });

    it('should return false if no values match', () => {
      const a = { a: 1, b: 2 };
      const b = { c: 3, a: 2 };

      assert.isFalse(equalSome(a, b));
    });
  });
});
