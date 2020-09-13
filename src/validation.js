const deepEqual = require('fast-deep-equal');
const objectGet = require('lodash.get');

// Utils
const {
  toArray,
  objectHas
} = require('./utils');

// Basic
const isNumber = any => typeof any === 'number';
const isObject = any => any !== null && !Array.isArray(any) && typeof any === 'object';
const isEmptyObject = object => Object.keys(object).length === 0;

// Operator
const operator = {
  gt: (a, b) => {
    if (!isNumber(a) || !isNumber(b)) return false;
    return a > b;
  },
  gte: (a, b) => {
    if (!isNumber(a) || !isNumber(b)) return false;
    return a >= b;
  },
  lt: (a, b) => {
    if (!isNumber(a) || !isNumber(b)) return false;
    return a < b;
  },
  lte: (a, b) => {
    if (!isNumber(a) || !isNumber(b)) return false;
    return a <= b;
  },
  not: (a, b) => a !== b,
  exists: (object, keys) => keys
    .filter(key => objectGet(object, key) !== undefined)
    .length === keys.length,
  has: (array, value) => array
    .some(item => deepEqual(item, value))
};

/**
 * Test if query matches
 * @param {object} query
 * @param {object} object
 */
const isQueryMatch = (object, query) => Object
  .entries(query)
  .filter(([key, value]) => {
    // Operators
    if (key[0] === '$') {
      for (let j = 0, ofe = Object.entries(value); j < ofe.length; j += 1) {
        const [field, testValue] = ofe[j];
        const originalValue = objectGet(object, field); // Object value

        switch (key) {
          case '$gt':
            if (!operator.gt(originalValue, testValue)) return false;
            break;
          case '$gte':
            if (!operator.gte(originalValue, testValue)) return false;
            break;
          case '$lt':
            if (!operator.lt(originalValue, testValue)) return false;
            break;
          case '$lte':
            if (!operator.lte(originalValue, testValue)) return false;
            break;
          case '$not':
            if (!operator.not(originalValue, testValue)) return false;
            break;
          case '$exists':
            if (!operator.exists(object, toArray(value))) return false;
            break;
          case '$has':
            if (!Array.isArray(originalValue)) return false;
            if (!operator.has(originalValue, testValue)) return false;
            break;
          default:
            throw new Error(`Invalid operator: ${key}`);
        }
      }
    // Regular
    } else if (!deepEqual(objectGet(object, key), value)) {
      return false;
    }
    // Does match
    return true;
  })
  .length === Object.keys(query).length;

const isInvalidDoc = doc => objectHas(doc, ({ key, value }) => {
  if (key[0] === '$') return true;
  if (key.includes('.')) return true;
  if (value === undefined) return true;
  return false;
});

/** Validate if object has modifier fields */
const hasModifiers = object => objectHas(object, ({ key }) => key[0] === '$');

/** Validate if object has keys and modifiers */
const hasMixedModifiers = object => (
  hasModifiers(object) &&
  Object.keys(object).filter(key => key[0] === '$').length !== Object.keys(object).length
);

module.exports = {
  isNumber,
  isObject,
  isEmptyObject,
  isQueryMatch,
  isInvalidDoc,
  hasModifiers,
  hasMixedModifiers
};
