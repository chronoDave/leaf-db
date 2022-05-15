import fs from 'fs';
import path from 'path';

import { MISSING_FD, NOT_ABSOLUTE } from './errors';
import { readLines } from './utils';

export type StorageOptions = {
  root: string
  name?: string
};

export default class Storage {
  private readonly _file: string;
  private readonly _temp: string;
  private _fd?: number;

  constructor(options: StorageOptions) {
    if (!path.isAbsolute(options.root)) throw new Error(NOT_ABSOLUTE('root'));

    const name = options.name || 'leaf-db';
    const file = {
      dir: options.root,
      ext: '.txt'
    };

    this._file = path.format({ ...file, name });
    this._temp = path.format({ ...file, name: `_${name}` });
  }

  append(raw: string) {
    if (typeof this._fd !== 'number') throw new Error(MISSING_FD);
    fs.appendFileSync(this._fd, raw);
  }

  async open(cb: (raw: string) => void) {
    if (fs.existsSync(this._file)) {
      fs.renameSync(this._file, this._temp);
      this._fd = fs.openSync(this._file, 'a');
      await readLines(this._temp, cb);
      fs.unlinkSync(this._temp);
    } else {
      fs.mkdirSync(path.parse(this._file).dir, { recursive: true });
      this._fd = fs.openSync(this._file, 'a');
    }
  }

  close() {
    if (typeof this._fd !== 'number') throw new Error(MISSING_FD);
    fs.closeSync(this._fd);
  }

  clear() {
    if (typeof this._fd !== 'number') throw new Error(MISSING_FD);
    fs.closeSync(this._fd);
    fs.rmSync(this._file);
    this._fd = fs.openSync(this._file, 'a');
  }
}
