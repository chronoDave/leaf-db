const {
  isObject,
  objectSomeKey
} = require('./utils');

const hasModifiers = object => {
  if (objectSomeKey(object, key => key[0] === '$')) return true;
  return false;
};

/** Validate if object has mixed field modifiers, iteratively */
const hasMixedFieldModifiers = object => {
  const stack = [Object.entries(object)];

  while (stack.length > 0) {
    const kv = stack.pop();

    const modifiers = kv.filter(([key]) => key[0] === '$');
    if (
      modifiers.length !== 0 &&
      kv.length !== modifiers.length
    ) return true;

    kv.forEach(([, value]) => {
      if (typeof value === 'object') stack.push(Object.entries(value));
    });
  }

  return false;
};

const isValidQuery = query => {
  if (!isObject(query)) return false;
  return true;
};

const isValidUpdate = update => {
  if (!isObject(update)) return false;
  if (Object.keys(update).includes('_id')) return false;
  if (hasMixedFieldModifiers(update)) return false;
  if (
    hasModifiers(update) &&
    objectSomeKey(update, key => key[0] === '$' && !isObject(update[key]))
  ) return false;
  return true;
};

module.exports = {
  hasModifiers,
  hasMixedFieldModifiers,
  isValidQuery,
  isValidUpdate
};
