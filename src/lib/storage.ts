import type { FileHandle } from 'fs/promises';

import fsp from 'fs/promises';
import path from 'path';

export type StorageOptions = {
  name: string;
  dir: string;
};

export default class Storage {
  private readonly _file: string;
  private _fd?: FileHandle;

  private async _open() {
    this._fd = await fsp.open(this._file, 'a');
  }

  constructor(options: StorageOptions) {
    this._file = path.format({
      dir: options.dir,
      name: options.name,
      ext: '.ndjson'
    });
  }

  async open(): Promise<string[]> {
    try {
      const raw = await fsp.readFile(this._file, 'utf-8');

      await this._open();

      return raw.split('\n');
    } catch (err) {
      await fsp.mkdir(path.parse(this._file).dir, { recursive: true });

      await this._open();

      return [];
    }
  }

  async close() {
    await this._fd?.close();
    delete this._fd;
  }

  async write(x: string) {
    await this._fd?.close();
    await fsp.writeFile(this._file, x);
    await this._open();
  }

  async append(x: string) {
    if (!this._fd) throw new Error('No file found');
    return this._fd.appendFile(`\n${x}`);
  }

  async flush() {
    await this._fd?.close();
    await fsp.rm(this._file);
    await this._open();
  }
}
