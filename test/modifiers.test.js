const chaiAsPromised = require('chai-as-promised');
const { assert, expect } = require('chai').use(chaiAsPromised);

const {
  modifierInc,
  modifierSet,
  applyModifier
} = require('../src/lib/modifiers');

describe('Modifiers', () => {
  describe('modifierInc()', () => {
    it('should throw an error on non-number value', () => (
      expect(() => modifierInc({ a: '3' }, { a: 3 })).to.throw()
    ));

    it('should ignore on non-number field', () => (
      expect(() => modifierInc({ a: 3 }, { a: '3' })).to.not.throw()
    ));

    it('should ignore if field does not exist', () => (
      expect(() => modifierInc({ b: 3 }, { a: '3' })).to.not.throw()
    ));

    it('should increase value if field is number', () => {
      const original = { a: 4 };
      const modified = modifierInc({ a: 3 }, original);

      assert.strictEqual(modified.a, 7);
    });

    it('should decrease value if field is negative number', () => {
      const original = { a: 4 };
      const modified = modifierInc({ a: -5 }, original);

      assert.strictEqual(modified.a, -1);
    });
  });

  describe('modifierSet()', () => {
    it('should create field if field does not exist', () => {
      const original = { a: 4 };
      const modified = { a: 4, b: 5 };

      assert.deepEqual(modifierSet({ b: 5 }, original), modified);
    });

    it('should override field if field exists', () => {
      const original = { a: 4 };
      const modified = { a: 5 };

      assert.deepEqual(modifierSet(modified, original), modified);
    });
  });

  describe('applyModifier()', () => {
    it('should throw an error on invalid modifier', () => (
      expect(() => applyModifier('a', {}, {})).to.throw()
    ));

    /**
     * Sample test, as modifier function itself
     * is tested in the unit tests above
     */
    it('should return modified object on valid modifier', () => {
      const original = { a: 4 };
      const modified = applyModifier('$inc', { a: 3 }, original);

      assert.strictEqual(modified.a, 7);
    });
  });
});
