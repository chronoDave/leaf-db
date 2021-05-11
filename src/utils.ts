import crypto from 'crypto';

export const toArray = <T>(x: T) => (Array.isArray(x) ? x : [x]) as T extends unknown[] ? T : T[];

export const generateUid = (() => {
  let counter = crypto.randomBytes(1).readUInt8();

  return () => {
    counter += 1;
    return `${Date.now().toString(16)}${crypto.randomBytes(5).toString('hex')}${counter.toString(16)}`;
  };
})();
