// src/lib/storage.ts
import fsp from "fs/promises";
import path from "path";
var Storage = class {
  #file;
  #fd;
  async #open() {
    this.#fd = await fsp.open(this.#file, "a");
  }
  constructor(options) {
    this.#file = path.format({
      dir: options.dir,
      name: options.name,
      ext: ".jsonl"
    });
  }
  async open() {
    try {
      const raw = await fsp.readFile(this.#file, "utf-8");
      await this.#open();
      return raw.split("\n");
    } catch (_) {
      await fsp.mkdir(path.parse(this.#file).dir, { recursive: true });
      await this.#open();
      return [];
    }
  }
  async close() {
    await this.#fd?.close();
    this.#fd = void 0;
  }
  async write(x) {
    await this.#fd?.close();
    await fsp.writeFile(this.#file, x);
    await this.#open();
  }
  async append(x) {
    if (!this.#fd) throw new Error("No file found");
    return this.#fd.appendFile(`${x}
`);
  }
  async flush() {
    await this.#fd?.close();
    await fsp.rm(this.#file);
    await this.#open();
  }
};
export {
  Storage as default
};
