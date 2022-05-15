import fs from 'fs';
import crypto from 'crypto';
import Rlr from 'rlr';

export const toArray = <T>(x: T | T[]) => Array.isArray(x) ? x : [x];

export const readLines = async (
  file: fs.PathLike,
  cb: ((line: string) => void)
) => new Promise<void>((resolve, reject) => new Rlr()
  .createInterface(file)
  .on('line', cb)
  .on('close', resolve)
  .on('error', reject));

export const idGenerator = (seed?: number) => {
  let _seed = seed ?? crypto.randomBytes(1).readUInt8();

  return () => {
    const timestamp = Date.now().toString(16);
    const random = crypto.randomBytes(5).toString('hex');

    _seed += 1;
    return `${timestamp}${random}${_seed.toString(16)}`;
  };
};
