import fs from 'fs';
import path from 'path';

import { MISSING_FD } from './errors.ts';

export type StorageOptions = {
  root: string;
  name: string;
};

export default class Storage {
  private readonly _file: string;
  private _fd?: number;

  constructor(options: StorageOptions) {
    this._file = path.format({
      dir: options.root,
      name: options.name,
      ext: '.txt'
    });
  }

  open() {
    let data: string[] = [];

    if (fs.existsSync(this._file)) {
      data = fs.readFileSync(this._file, { encoding: 'utf-8' })
        .split('\n');
    } else {
      fs.mkdirSync(path.parse(this._file).dir, { recursive: true });
    }

    this._fd = fs.openSync(this._file, 'a');
    return data;
  }

  close() {
    if (typeof this._fd !== 'number') throw new Error(MISSING_FD('close'));
    fs.closeSync(this._fd);
    delete this._fd;
  }

  append(raw: string) {
    if (typeof this._fd !== 'number') throw new Error(MISSING_FD('append'));
    fs.appendFileSync(this._fd, `${raw}\n`);
  }

  flush() {
    if (typeof this._fd !== 'number') throw new Error(MISSING_FD('flush'));
    fs.closeSync(this._fd);
    fs.rmSync(this._file);
    this._fd = fs.openSync(this._file, 'a');
  }
}
