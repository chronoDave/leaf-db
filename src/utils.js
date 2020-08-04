const crypto = require('crypto');
const objectGet = require('lodash.get');
const objectSet = require('lodash.set');

const toArray = any => (Array.isArray(any) ? any : [any]);

/**
 * Generate unique ID
 * @param {number} length - ID length (can be shorter if ID contains invalid characters)
 * */
const getUid = (length = 16) => crypto
  .randomBytes(Math.ceil((length * 5) / 4))
  .toString('base64')
  .replace(/[+/]/g, '')
  .slice(0, length);

/**
 * Check if `object` has `key` or `value`
 * @param {object} object
 * @param {object} options
 * @param {function} validator - `validator({ key, value }) => Boolean`
 */
const objectHas = (object, validator) => {
  const stack = Object.entries(object);

  while (stack.length > 0) {
    const [key, value] = stack.pop();

    if (validator({ key, value })) return true;
    if (typeof value === 'object') stack.push(...Object.entries(value));
  }

  return false;
};

const objectModify = (object, modifiers) => {
  const mEntries = Object.entries(modifiers);
  const newObject = object;

  for (let i = 0; i < mEntries.length; i += 1) {
    const [modifier, fields] = mEntries[i];
    const fEntries = Object.entries(fields);

    for (let j = 0; j < fEntries.length; j += 1) {
      const [key, value] = fEntries[j];

      switch (modifier) {
        case '$inc': {
          const oldValue = objectGet(newObject, key);
          if (typeof oldValue === 'number') {
            objectSet(newObject, key, oldValue + value);
          }
          break;
        }
        default:
          throw new Error(`Invalid modifier: ${modifier}`);
      }
    }
  }

  return newObject;
};

module.exports = {
  getUid,
  toArray,
  objectHas,
  objectModify
};
