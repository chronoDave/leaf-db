const crypto = require('crypto');
const objectSet = require('lodash.set');
const objectGet = require('lodash.get');

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

const modifiers = {
  inc: (object, key, value) => {
    if (
      typeof value !== 'number' ||
      !objectGet(object, key)
    ) return object;
    return objectSet(object, key, objectGet(object, key) + value);
  },
  set: (object, key, value) => objectSet(object, key, value)
};

const objectModify = (object, update) => {
  for (let i = 0, ue = Object.entries(update); i < ue.length; i += 1) {
    const [modifier, fields] = ue[i];

    for (let j = 0, fe = Object.entries(fields); j < fe.length; j += 1) {
      const [key, value] = fe[j];

      switch (modifier) {
        case '$inc':
          return modifiers.inc(object, key, value);
        case '$set':
          return modifiers.set(object, key, value);
        default:
          throw new Error(`Invalid modifier: ${modifier}`);
      }
    }
  }

  return object;
};

module.exports = {
  getUid,
  toArray,
  objectHas,
  objectModify
};
