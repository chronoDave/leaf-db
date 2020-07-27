/**
 * Increase numeric field
 * @param {object} modifier - `key` field to modify - `value` numeric value
 * @param {object} object
 */
const modifierInc = (modifier, object) => {
  const modified = object;

  Object
    .entries(modifier)
    .forEach(([key, value]) => {
      if (typeof value !== 'number') {
        throw new Error(`Value must be of type 'number': ${value}`);
      }
      if (typeof modified[key] !== 'number') {
        throw new Error(`Field value must be of type 'number': ${modified[key]}`);
      }

      modified[key] += value;
    });

  return object;
};

/**
 * Override original fields with new value
 * - If field does not exist, create it
 * @param {object} modifier - `key` field to modify - `value` numeric value
 * @param {object} object
 */
const modifierSet = (modifier, object) => ({
  ...object,
  ...modifier
});

/**
 * Apply modifier on object
 * @param {string} modifier - Modifier key, starting with `$`
 * @param {object} value - Modifier value
 * @param {object} object - Objec to be modified
 * @returns {object} Modified object
 */
const applyModifier = (modifier, value, object) => {
  switch (modifier) {
    case '$inc':
      return modifierInc(value, object);
    case '$set':
      return modifierSet(value, object);
    default:
      throw new Error(`Invalid modifier: ${modifier}`);
  }
};

module.exports = {
  modifierInc,
  modifierSet,
  applyModifier
};
