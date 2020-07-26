const {
  isObject,
  objectSomeKey
} = require('./utils');

const hasModifiers = object => {
  if (objectSomeKey(object, key => key.includes('.'))) return true;
  if (objectSomeKey(object, key => key[0] === '$')) return true;
  return false;
};

const hasMixedFieldModifiers = object => {
  const modifiers = Object.keys(object).filter(key => key[0] === '$');
  return (
    modifiers.length !== 0 &&
    Object.keys(object).length !== modifiers.length
  );
};

const isValidQuery = query => {
  if (!isObject(query)) return false;
  if (hasMixedFieldModifiers(query)) return false;
  return true;
};

const isValidUpdate = update => {
  if (!isObject(update)) return false;
  if (Object.keys(update).includes('_id')) return false;
  if (hasMixedFieldModifiers(update)) return false;
  return true;
};

module.exports = {
  hasModifiers,
  hasMixedFieldModifiers,
  isValidQuery,
  isValidUpdate
};
