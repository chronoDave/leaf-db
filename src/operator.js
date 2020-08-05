const deepEqual = require('fast-deep-equal');
const objectGet = require('lodash.get');

// Logic
const isGt = (a, b) => a > b;
const isGte = (a, b) => a >= b;
const isLt = (a, b) => a < b;
const isLte = (a, b) => a <= b;

// Object
const isKey = (object, keys) => keys
  .filter(key => !!objectGet(object, key))
  .length === keys.length;

// Array
const isInclude = (array, value) => array
  .some(item => deepEqual(item, value));

module.exports = {
  isGt,
  isGte,
  isLt,
  isLte,
  isKey,
  isInclude
};
