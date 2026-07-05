import type { FileHandle } from 'fs/promises';

import fsp from 'fs/promises';
import path from 'path';

export type StorageOptions = {
  name: string;
  dir: string;
};

export default class Storage {
  readonly #file: string;

  #fd?: FileHandle;

  async #open() {
    this.#fd = await fsp.open(this.#file, 'a');
  }

  constructor(options: StorageOptions) {
    this.#file = path.format({
      dir: options.dir,
      name: options.name,
      ext: '.jsonl'
    });
  }

  async open(): Promise<string[]> {
    try {
      const raw = await fsp.readFile(this.#file, 'utf-8');

      await this.#open();

      return raw.split('\n');
    } catch (_) {
      await fsp.mkdir(path.parse(this.#file).dir, { recursive: true });

      await this.#open();

      return [];
    }
  }

  async close() {
    await this.#fd?.close();
    this.#fd = undefined;
  }

  async write(x: string) {
    await this.#fd?.close();
    await fsp.writeFile(this.#file, x);
    await this.#open();
  }

  async append(x: string) {
    if (!this.#fd) throw new Error('No file found');

    return this.#fd.appendFile(`${x}\n`);
  }

  async flush() {
    await this.#fd?.close();
    await fsp.rm(this.#file);
    await this.#open();
  }
}
