const crypto = require('crypto');

/**
 * Generate unique ID
 * @param {number} length - ID length (can be shorter if ID contains invalid characters)
 * */
const getUid = (length = 8) => crypto
  .randomBytes(Math.ceil((length * 5) / 4))
  .toString('base64')
  .replace(/[+/]/g, '')
  .slice(0, length);

const toArray = any => (Array.isArray(any) ? any : [any]);
const isObject = any => any !== null && !Array.isArray(any) && typeof any === 'object';
const isEmptyObject = object => Object.keys(object).length === 0;

/** Return if some `a` values matches with `b` values */
const equalSome = (a, b) => Object
  .keys(b)
  .some(key => a[key] === b[key]);

module.exports = {
  getUid,
  toArray,
  isObject,
  equalSome,
  isEmptyObject
};
