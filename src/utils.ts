import crypto from 'crypto';

export const toArray = <T>(x: T | T[]) => Array.isArray(x) ? x : [x];

export const idGenerator = (seed?: number) => {
  let _seed = seed ?? crypto.randomBytes(1).readUInt8();

  return () => {
    const timestamp = Date.now().toString(16);
    const random = crypto.randomBytes(5).toString('hex');

    _seed += 1;
    return `${timestamp}${random}${_seed.toString(16)}`;
  };
};
