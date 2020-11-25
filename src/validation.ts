import deepEqual from 'fast-deep-equal';
import objectGet from 'lodash.get';

// Types
import { Doc, Query, Value } from './types';

// Utils
import { toArray, objectHas } from './utils';

// Basic
export const isNumber = (any: unknown) => typeof any === 'number';
export const isObject = (any: unknown) => any !== null && !Array.isArray(any) && typeof any === 'object';
export const isEmptyObject = (object: object) => Object.keys(object).length === 0;

const exists = (object: object, keys: Array<Value>) => keys
  .filter(key => {
    if (typeof key === 'boolean') return false;
    if (typeof key === 'object') return false;
    return objectGet(object, key) !== undefined;
  })
  .length === keys.length;

/**
 * Test if query matches
 * @param {object} query
 * @param {object} object
 */
export const isQueryMatch = (object: Doc, query: Query): boolean => Object
  .entries(query)
  .filter(([key, value]) => {
    // Operators
    if (key[0] === '$') {
      switch (key) {
        case '$some':
          if (!Array.isArray(value)) return false;
          if (!value.some(testQuery => isObject(testQuery) && isQueryMatch(object, testQuery as Query))) return false;
          break;
        default: {
          for (let j = 0, ofe = Object.entries(value); j < ofe.length; j += 1) {
            const [field, testValue] = ofe[j];
            const originalValue = objectGet(object, field); // Object value

            switch (key) {
              case '$gt':
                if (!isNumber(originalValue) || !isNumber(testValue)) return false;
                if (!(originalValue > testValue)) return false;
                break;
              case '$gte':
                if (!isNumber(originalValue) || !isNumber(testValue)) return false;
                if (!(originalValue >= testValue)) return false;
                break;
              case '$lt':
                if (!isNumber(originalValue) || !isNumber(testValue)) return false;
                if (!(originalValue < testValue)) return false;
                break;
              case '$lte':
                if (!isNumber(originalValue) || !isNumber(testValue)) return false;
                if (!(originalValue <= testValue)) return false;
                break;
              case '$not':
                if (originalValue === testValue) return false;
                break;
              case '$exists':
                if (!exists(object, toArray(value))) return false;
                break;
              case '$has':
                if (!Array.isArray(originalValue)) return false;
                if (!originalValue.some(item => deepEqual(item, testValue))) return false;
                break;
              case '$string':
                if (typeof originalValue !== 'string' || typeof testValue !== 'string') return false;
                if (!originalValue.includes(testValue)) return false;
                break;
              case '$stringLoose':
                if (typeof originalValue !== 'string' || typeof testValue !== 'string') return false;
                if (!originalValue.toLowerCase().includes(testValue.toLowerCase())) return false;
                break;
              default:
                throw new Error(`Invalid operator: ${key}`);
            }
          }
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

export const isInvalidDoc = (doc: object) => objectHas(doc, ({ key, value }) => {
  if (key[0] === '$') return true;
  if (key.includes('.')) return true;
  if (value === undefined) return true;
  return false;
});

/** Validate if object has modifier fields */
export const hasModifiers = (object: object) => objectHas(object, ({ key }) => key[0] === '$');

/** Validate if object has keys and modifiers */
export const hasMixedModifiers = (object: object) => (
  hasModifiers(object) &&
  Object.keys(object).filter(key => key[0] === '$').length !== Object.keys(object).length
);
