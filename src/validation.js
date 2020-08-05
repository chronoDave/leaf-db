const deepEqual = require('fast-deep-equal');
const objectGet = require('lodash.get');

// Utils
const {
  toArray,
  objectHas
} = require('./utils');

// Operators
const operator = require('./operator');

/** Test if object */
const isObject = any => any !== null && !Array.isArray(any) && typeof any === 'object';

/** Test if empty object */
const isEmptyObject = object => Object.keys(object).length === 0;

/**
 * Test if query matches
 * @param {object} query
 * @param {object} object
 */
const isQueryMatch = (object, query) => {
  for (let i = 0, qe = Object.entries(query); i < qe.length; i += 1) {
    const [key, value] = qe[i];

    // Operators
    if (key[0] === '$') {
      for (let j = 0, ofe = Object.entries(value); j < ofe.length; j += 1) {
        const [field, testValue] = ofe[j];
        const originalValue = objectGet(object, field); // Object value

        switch (key) {
          case '$gt':
            if (!operator.isGt(originalValue, testValue)) return false;
            break;
          case '$gte':
            if (!operator.isGte(originalValue, testValue)) return false;
            break;
          case '$lt':
            if (!operator.isLt(originalValue, testValue)) return false;
            break;
          case '$lte':
            if (!operator.isLte(originalValue, testValue)) return false;
            break;
          case '$exists':
            if (!operator.isKey(object, toArray(testValue))) return false;
            break;
          case '$has':
            if (!Array.isArray(originalValue)) {
              throw new Error(`operator '$has' must point to array: ${JSON.stringify(objectValue)}`);
            }
            if (!operator.isInclude(originalValue, testValue)) return false;
            break;
          default:
            throw new Error(`Invalid operator: ${operator}`);
        }
      }
    // Regular
    } else if (!deepEqual(objectGet(object, key), value)) {
      return false;
    }
  }

  return true;
};

/** Validate if object has modifier fields */
const hasModifiers = object => objectHas(object, ({ key }) => key[0] === '$');

/** Validate if object has dot fields */
const hasDot = object => objectHas(object, ({ key }) => key.includes('.'));

/** Validate if object has keys and modifiers */
const hasMixedModifiers = object => (
  hasModifiers(object) &&
  Object.keys(object).filter(key => key[0] === '$').length !== Object.keys(object).length
);

module.exports = {
  isObject,
  isEmptyObject,
  isQueryMatch,
  hasModifiers,
  hasDot,
  hasMixedModifiers
};
