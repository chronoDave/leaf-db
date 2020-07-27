const { assert } = require('chai');

const {
  hasModifiers,
  hasMixedFieldModifiers,
  isValidQuery,
  isValidUpdate
} = require('../src/lib/validation');

describe('Validation', () => {
  describe('hasModifiers', () => {
    it('should return true if object has modifiers', () => {
      assert.isTrue(hasModifiers({ $inc: 3 }));
    });

    it('should return true if object has nested modifiers', () => {
      assert.isTrue(hasModifiers({ a: { $inc: 3 } }));
    });

    it('should return false if object does not have modifiers', () => {
      assert.isFalse(hasModifiers({ a: 3 }));
    });
  });

  describe('hasMixedFieldModifiers', () => {
    it('should return true if object has both fields and modifiers', () => {
      assert.isTrue(hasMixedFieldModifiers({ $inc: 3, b: 3 }));
    });

    it('should return true if mixing happens on any depth', () => {
      assert.isTrue(hasMixedFieldModifiers({ a: { $inc: 3, b: 3 } }));
    });

    it('should return false if object has only modifiers', () => {
      assert.isFalse(hasMixedFieldModifiers({ $inc: 3, $test: 3 }));
    });

    it('should return false if object has only fields', () => {
      assert.isFalse(hasMixedFieldModifiers({ a: 3, b: 3 }));
    });

    it('should return false if mixing happens on different depths', () => {
      assert.isFalse(hasMixedFieldModifiers({ a: 3, b: { $inc: 3 } }));
    });
  });

  describe('isValidQuery', () => {
    it('should return true if query is valid', () => {
      assert.isTrue(isValidQuery({ a: 3, $where: { b: { $gt: 5 } } }));
    });

    it('should return false if query is invalid', () => {
      assert.isFalse(isValidQuery(null));
    });
  });

  describe('isValidUpdate', () => {
    it('should return true if update is valid', () => {
      assert.isTrue(isValidUpdate({ $set: { a: 3 } }));
    });

    it('should return false if update is invalid', () => {
      assert.isFalse(isValidUpdate(null));
      assert.isFalse(isValidUpdate({ _id: 3 }));
      assert.isFalse(isValidUpdate({ a: 3, $inc: { b: 5 } }));
      assert.isFalse(isValidUpdate({ $inc: 5 }));
    });
  });
});
