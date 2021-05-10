import crypto from 'crypto';

export const toArray = <T>(x: T) => (Array.isArray(x) ? x : [x]) as T extends unknown[] ? T : T[];

export const generateUid = (() => {
  let counter = crypto.randomBytes(1).readUInt8();

  return () => {
    counter += 1;
    return `${Date.now().toString(16)}${crypto.randomBytes(5).toString('hex')}${counter.toString(16)}`;
  };
})();

/**
 * Check if `object` has `key` or `value`
 * @param {object} object
 * @param {object} options
 * @param {function} validator - `validator({ key, value }) => Boolean`
 */
export const objectHas = (
  object: object,
  validator: ({ key, value }: { key: string, value: unknown }) => boolean
) => {
  if (!object || typeof object !== 'object') return false;

  const stack = Object.entries(object);

  while (stack.length > 0) {
    const item = stack.pop();

    if (item) {
      const [key, value] = item;

      if (validator({ key, value })) return true;
      if (value && typeof value === 'object') stack.push(...Object.entries(value));
    }
  }

  return false;
};
