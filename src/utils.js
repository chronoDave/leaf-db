const crypto = require('crypto');

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
  if (!object || typeof object !== 'object') return false;

  const stack = Object.entries(object);

  while (stack.length > 0) {
    const [key, value] = stack.pop();

    if (validator({ key, value })) return true;
    if (value && typeof value === 'object') stack.push(...Object.entries(value));
  }

  return false;
};

module.exports = {
  getUid,
  toArray,
  objectHas
};
