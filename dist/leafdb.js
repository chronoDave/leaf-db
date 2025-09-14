import crypto from 'crypto';
import fsp from 'fs/promises';
import path from 'path';

class Storage {
  _file;
  _fd;
  async _open() {
    this._fd = await fsp.open(this._file, "a");
  }
  constructor(options) {
    this._file = path.format({
      dir: options.dir,
      name: options.name,
      ext: ".jsonl"
    });
  }
  async open() {
    try {
      const raw = await fsp.readFile(this._file, "utf-8");
      await this._open();
      return raw.split("\n");
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
  async write(x) {
    await this._fd?.close();
    await fsp.writeFile(this._file, x);
    await this._open();
  }
  async append(x) {
    if (!this._fd) throw new Error("No file found");
    return this._fd.appendFile(`
${x}`);
  }
  async flush() {
    await this._fd?.close();
    await fsp.rm(this._file);
    await this._open();
  }
}

const equals = (a) => (b) => {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => equals(b[i])(v));
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    const keys = Object.keys(a);
    if (keys.length !== Object.keys(b).length) return false;
    return keys.every((k) => equals(b[k])(a[k]));
  }
  return a === b;
};

const isObject = (x) => x !== null && !Array.isArray(x) && typeof x === "object";
const hasModifier = (x) => Object.entries(x).some(([k, v]) => {
  if (k.startsWith("$")) return true;
  return isObject(v) ? hasModifier(v) : false;
});
var parse = (x) => {
  const raw = JSON.parse(x);
  if (!isObject(raw)) throw new Error("Not an object");
  if (!("_id" in raw)) throw new Error("Missing _id");
  if (hasModifier(raw)) throw new Error("Has modifier");
  return raw;
};

const match = (doc) => (query) => {
  if ("$not" in query) return !match(doc)(query.$not);
  if ("$or" in query) return query.$or.some(match(doc));
  if ("$and" in query) return query.$and.every(match(doc));
  return Object.entries(query).every(([key, rule]) => {
    if (isObject(rule)) {
      const keys = Object.keys(rule);
      const operator = keys[0];
      const a = doc[key];
      const b = rule[operator];
      if (operator === "$gt") return a > b;
      if (operator === "$gte") return a >= b;
      if (operator === "$lt") return a < b;
      if (operator === "$lte") return a <= b;
      if (operator === "$regexp") return b.test(a);
      if (operator === "$size") return a.length === b;
      if (operator === "$includes") return a.includes(b);
      if (isObject(a)) return match(a)(rule);
    }
    return equals(doc[key])(rule);
  });
};

class LeafDB {
  static id() {
    return `${Date.now().toString(16)}-${crypto.randomBytes(4).toString("hex")}`;
  }
  _memory;
  _storage;
  get docs() {
    return Array.from(this._memory.values());
  }
  constructor(options) {
    this._memory = /* @__PURE__ */ new Map();
    if (options) this._storage = new Storage(options);
  }
  async open() {
    if (!this._storage) return [];
    let data = "";
    const corrupt = [];
    for (const raw of await this._storage.open()) {
      if (raw.length === 0) continue;
      try {
        const doc = parse(raw);
        if ("__deleted" in doc) {
          this._memory.delete(doc._id);
        } else {
          this._memory.set(doc._id, doc);
          data += `
${raw}`;
        }
      } catch (err) {
        corrupt.push({ raw, error: err });
      }
    }
    await this._storage.write(data);
    return corrupt;
  }
  async close() {
    return this._storage?.close();
  }
  get(id) {
    return this._memory.get(id) ?? null;
  }
  async set(draft) {
    if ("__deleted" in draft) throw new Error("Invalid draft, cannot contain key `__deleted`");
    if (typeof draft._id !== "string") draft._id = LeafDB.id();
    this._memory.set(draft._id, draft);
    await this._storage?.append(JSON.stringify(draft));
    return draft._id;
  }
  query(query) {
    const docs = [];
    for (const doc of this._memory.values()) {
      if (match(doc)(query)) docs.push(doc);
    }
    return docs;
  }
  async delete(id) {
    this._memory.delete(id);
    await this._storage?.append(JSON.stringify({ _id: id, __deleted: true }));
  }
  async drop() {
    this._memory.clear();
    await this._storage?.flush();
  }
}

export { LeafDB as default };
