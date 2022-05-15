import fs from 'fs';
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
