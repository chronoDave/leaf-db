const objectSet = require('lodash.set');
const objectGet = require('lodash.get');

const inc = (object, key, value) => {
  if (
    typeof value !== 'number' ||
    !objectGet(object, key)
  ) return object;
  return objectSet(object, key, objectGet(object, key) + value);
};

const set = (object, key, value) => objectSet(object, key, value);

module.exports = {
  inc,
  set
};
