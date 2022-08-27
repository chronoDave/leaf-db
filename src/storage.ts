import fs from 'fs';
import path from 'path';

import { MISSING_FD, NOT_ABSOLUTE } from './errors';

export type StorageOptions = {
  root: string
  name?: string
};

export default class Storage {
  private readonly _file: string;
  private _fd?: number;

  private _readFile() {
    const data = fs.readFileSync(this._file, { encoding: 'utf-8' })
      .split('\n');

    fs.rmSync(this._file);
    this._fd = fs.openSync(this._file, 'a');

    return data;
  }

  constructor(options: StorageOptions) {
    if (!path.isAbsolute(options.root)) throw new Error(NOT_ABSOLUTE);

    this._file = path.format({
      dir: options.root,
      name: options.name || 'leaf-db',
      ext: '.txt'
    });
  }

  append(raw: string) {
    if (typeof this._fd !== 'number') throw new Error(MISSING_FD);
    fs.appendFileSync(this._fd, raw);
  }

  open(): string[] {
    if (fs.existsSync(this._file)) return this._readFile();

    fs.mkdirSync(path.parse(this._file).dir, { recursive: true });
    this._fd = fs.openSync(this._file, 'a');
    return [];
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
