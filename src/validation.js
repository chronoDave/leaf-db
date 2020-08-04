const deepEqual = require('fast-deep-equal');
const objectGet = require('lodash.get');

// Utils
const { objectHas } = require('./utils');

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
  const qEntries = Object.entries(query);

  for (let i = 0; i < qEntries.length; i += 1) {
    const [qKey, qValue] = qEntries[i];

    // Operators
    if (qKey[0] === '$') {
      const oEntries = Object.entries(qValue);

      for (let j = 0; j < oEntries.length; j += 1) {
        const [oKey, oValue] = oEntries[j];

        switch (qKey) {
          case '$gt':
            if (!(objectGet(object, oKey) > oValue)) return false;
            break;
          case '$gte':
            if (!(objectGet(object, oKey) >= oValue)) return false;
            break;
          case '$lt':
            if (!(objectGet(object, oKey) < oValue)) return false;
            break;
          case '$lte':
            if (!(objectGet(object, oKey) <= oValue)) return false;
            break;
          default:
            throw new Error(`Invalid operator: ${qKey}`);
        }
      }
    } else if (!deepEqual(objectGet(object, qKey), qValue)) {
      return false;
    }
  }

  return true;
};

/** Validate if object has modifiers */
const hasModifiers = object => objectHas(object, ({ key }) => key[0] === '$');

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
  hasMixedModifiers
};
