const objectSet = require('lodash.set');
const objectGet = require('lodash.get');

const modifiers = {
  add: (object, key, value) => {
    if (
      typeof objectGet(object, key) !== 'number' ||
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
        case '$add':
          return modifiers.add(object, key, value);
        case '$set':
          return modifiers.set(object, key, value);
        default:
          throw new Error(`Invalid modifier: ${modifier}`);
      }
    }
  }

  return object;
};

const objectProject = (object, projection) => {
  if (!projection) return object;

  if (!Array.isArray(projection)) {
    throw new Error(`Invalid projection, must be of type 'Array' or falsy: ${projection}`);
  }

  if (projection.length === 0) return {};

  if (projection.some(key => typeof key !== 'string' || key[0] === '$')) {
    throw new Error(`Invalid projection, contains invalid key: ${projection}`);
  }

  return projection.reduce((acc, key) => objectSet(acc, key, objectGet(object, key)), {});
};

module.exports = {
  objectModify,
  objectProject
};
