const crypto = require('crypto');

const toArray = any => (Array.isArray(any) ? any : [any]);
const isObject = any => any !== null && !Array.isArray(any) && typeof any === 'object';
const isEmptyObject = object => Object.keys(object).length === 0;

/**
 * Generate unique ID
 * @param {number} length - ID length (can be shorter if ID contains invalid characters)
 * */
const getUid = (length = 16) => crypto
  .randomBytes(Math.ceil((length * 5) / 4))
  .toString('base64')
  .replace(/[+/]/g, '')
  .slice(0, length);

/** Return if some `a` values matches with `b` values */
const equalSome = (a, b) => Object
  .keys(b)
  .some(key => a[key] === b[key]);

/**
 * Return first key found in object, iteratively
 * @param {object} object
 * @param {string|number|function} cb - `key === (cb || cb(key)`
 * */
const objectSomeKey = (object, cb) => {
  const stack = Object.entries(object);

  while (stack.length > 0) {
    const [key, value] = stack.pop(); // Order does not matter

    if (typeof cb === 'function' && cb(key)) return true;
    if (key === cb) return true;

    if (typeof value === 'object') stack.push(...Object.entries(value));
  }

  return false;
};

module.exports = {
  getUid,
  toArray,
  isObject,
  equalSome,
  isEmptyObject,
  objectSomeKey
};
