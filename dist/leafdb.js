var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/lib/storage.ts
var storage_exports = {};
__export(storage_exports, {
  default: () => Storage
});
import fsp from "fs/promises";
import path from "path";
var Storage;
var init_storage = __esm({
  "src/lib/storage.ts"() {
    "use strict";
    Storage = class {
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
        return this._fd.appendFile(`${x}
`);
      }
      async flush() {
        await this._fd?.close();
        await fsp.rm(this._file);
        await this._open();
      }
    };
  }
});

// src/lib/fn.ts
var equals = (a) => (b) => {
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

// src/lib/parse.ts
var isObject = (x) => x !== null && !Array.isArray(x) && typeof x === "object";
var hasModifier = (x) => Object.entries(x).some(([k, v]) => {
  if (k.startsWith("$")) return true;
  return isObject(v) ? hasModifier(v) : false;
});
var parse_default = (x) => {
  const raw = JSON.parse(x);
  if (!isObject(raw)) throw new Error("Not an object");
  if (!("_id" in raw)) throw new Error("Missing _id");
  if (hasModifier(raw)) throw new Error("Has modifier");
  return raw;
};

// src/lib/query.ts
var match = (doc) => (query) => {
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
      if (operator === "$length") return a.length === b;
      if (operator === "$includes") return a.includes(b);
      if (isObject(a)) return match(a)(rule);
    }
    return equals(doc[key])(rule);
  });
};
var query_default = match;

// src/leafdb.ts
var LeafDB = class _LeafDB {
  static id() {
    return `${Date.now().toString(16)}-${Math.floor(Math.random() * 4294967296).toString(16)}`;
  }
  _memory;
  _storage;
  async _set(doc) {
    this._memory.set(doc._id, doc);
    await this._storage?.append(JSON.stringify(doc));
  }
  /** Get all documents */
  get docs() {
    return Array.from(this._memory.values());
  }
  constructor() {
    this._memory = /* @__PURE__ */ new Map();
  }
  /** Read existing file and store to internal memory */
  async open(options) {
    const { default: Storage2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
    this._storage = new Storage2(options);
    let data = "";
    const corrupt = [];
    for (const raw of await this._storage.open()) {
      if (raw.length === 0) continue;
      try {
        const doc = parse_default(raw);
        if ("__deleted" in doc) {
          this._memory.delete(doc._id);
        } else {
          this._memory.set(doc._id, doc);
          data += `${raw}
`;
        }
      } catch (err) {
        corrupt.push({ raw, error: err });
      }
    }
    await this._storage.write(data);
    return corrupt;
  }
  /** Close file */
  async close() {
    return this._storage?.close();
  }
  /** Get document by `id` */
  get(id) {
    return this._memory.get(id) ?? null;
  }
  /** Create new document, throws if document already exists */
  async insert(draft) {
    if (typeof draft._id !== "string") {
      draft._id = _LeafDB.id();
    } else if (this._memory.has(draft._id)) {
      throw new Error("Invalid draft, _id already exists");
    }
    await this._set(draft);
    return draft;
  }
  /** Find document by query */
  query(query) {
    const docs = [];
    for (const doc of this._memory.values()) {
      if (query_default(doc)(query)) docs.push(doc);
    }
    return docs;
  }
  /** Update document, throws if document does not exist */
  async update(doc) {
    if (!this._memory.has(doc._id)) throw new Error("Tried to update new document");
    return this._set(doc);
  }
  /** Delete document by `id` */
  async delete(id) {
    if (!this._memory.has(id)) return;
    this._memory.delete(id);
    await this._storage?.append(JSON.stringify({ _id: id, __deleted: true }));
  }
  /** Delete all documents */
  async drop() {
    this._memory.clear();
    await this._storage?.flush();
  }
};
export {
  LeafDB as default
};
