import fs, { PathLike } from 'fs';
import path from 'path';
import crypto from 'crypto';

import type {
  OneOrMore,
  Doc,
  DocInternal,
  Projection,
  Query,
  Update,
} from './types';
import { modify, project } from './modifiers';
import {
  isId,
  isIdArray,
  isDoc,
  isDocStrict,
  isQuery,
  isQueryMatch,
  hasOperators,
  isUpdate,
} from './validation';
import {
  MEMORY_MODE,
  INVALID_ID,
  INVALID_DOC,
  INVALID_QUERY,
  INVALID_UPDATE,
  DUPLICATE_DOC
} from './errors';

// Exports
export type {
  OneOrMore,
  Never,
  DocBase,
  Doc,
  DocInternal,
  Tags,
  Operators,
  Modifiers,
  Query,
  Projection,
  Update
} from './types';

export default class LeafDB<T extends Doc> {
  readonly root?: string;
  readonly strict: boolean;
  readonly file?: PathLike;

  private map: Record<string, DocInternal<T>>;
  private list: Set<string>;
  private seed: number;

  constructor(options?: {
    name?: string,
    root?: string,
    disableAutoload?: boolean,
    strict?: boolean
  }) {
    this.strict = !!options?.strict;
    this.map = {};
    this.list = new Set();
    this.seed = crypto.randomBytes(1).readUInt8();

    if (options?.root) {
      fs.mkdirSync(options.root, { recursive: true });
      this.file = path.resolve(options.root, `${options?.name || 'leafdb'}.txt`);
      if (!options?.disableAutoload) this.load();
    }
  }

  private flush() {
    this.map = {};
    this.list = new Set();
  }

  private generateUid() {
    const timestamp = Date.now().toString(16);
    const random = crypto.randomBytes(5).toString('hex');

    this.seed += 1;
    return `${timestamp}${random}${this.seed.toString(16)}`;
  }

  /**
   * Initialize database
   * @returns {string[]} List of corrupt items
   * */
  load() {
    if (!this.file) throw new Error(MEMORY_MODE('load'));

    const corrupted = [];
    if (fs.existsSync(this.file)) {
      this.flush();

      const rawDocs = fs
        .readFileSync(this.file, 'utf-8')
        .split('\n');
      for (let i = 0; i < rawDocs.length; i += 1) {
        const rawDoc = rawDocs[i];
        if (rawDoc) {
          try {
            const doc = JSON.parse(rawDoc);
            if (!isDocStrict<T>(doc)) throw new Error(INVALID_DOC(doc));

            this.list.add(doc._id);
            this.map[doc._id] = doc;
          } catch (err) {
            if (this.strict) throw err;

            corrupted.push(rawDoc);
          }
        }
      }
    } else {
      fs.writeFileSync(this.file, '');
    }

    return corrupted;
  }

  /** Persist database */
  persist() {
    if (!this.file) throw new Error(MEMORY_MODE('persist'));

    const payload: string[] = [];
    this.list.forEach(_id => {
      try {
        const doc = this.map[_id];
        if (!doc.$deleted) payload.push(JSON.stringify(doc));
      } catch (err) {
        this.list.delete(_id);
        delete this.map[_id];

        if (this.strict) throw err;
      }
    });

    fs.writeFileSync(this.file, payload.join('\n'));
  }

  /**
   * Insert new document
   * @param {object} doc
   */
  insertOne(doc: T): Promise<T> {
    return new Promise(resolve => {
      if (!isDoc(doc)) throw new Error(INVALID_DOC(doc));

      const newDoc = { ...doc, _id: doc._id || this.generateUid() };
      if (this.list.has(newDoc._id)) throw new Error(DUPLICATE_DOC(newDoc));

      this.list.add(newDoc._id);
      this.map[newDoc._id] = newDoc;

      resolve(newDoc);
    });
  }

  /**
   * Insert new document(s)
   * @param {object|object[]} docs
   */
  async insert(docs: OneOrMore<T>): Promise<T[]> {
    if (Array.isArray(docs)) return Promise.all(docs.map(doc => this.insertOne(doc)));

    try {
      const doc = await this.insertOne(docs);
      return Promise.resolve([doc]);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  /**
   * Find doc by `_id`
   * @param {string} _id Doc _id
   * @param {string[]} projection Projection array
   */
  findById(_id: string, projection?: Projection): Promise<Partial<T> | null> {
    return new Promise(resolve => {
      if (!isId(_id)) throw new Error(INVALID_ID(_id));

      const doc = this.map[_id];
      if (doc && !doc.$deleted) return resolve(project(doc, projection));
      return resolve(null);
    });
  }

  /**
   * Find doc(s) by `query`
   * @param {string[]|object} query List of doc `_id`'s / query object (default `{}`)
   * @param projection - Projection array
   */
  async find(query: string[] | Query = {}, projection?: Projection): Promise<Partial<T>[]> {
    if (isIdArray(query)) {
      try {
        const docs = await Promise
          .all(query.map(id => this.findById(id, projection)))
          .then(result => result.flatMap(i => (i ? [i] : [])));
        return Promise.resolve(docs);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return new Promise(resolve => {
      if (!isQuery(query)) throw new Error(INVALID_QUERY(query));

      const payload: Partial<T>[] = [];
      this.list.forEach(id => {
        const doc = this.map[id];
        if (isQueryMatch(doc, query)) payload.push(project(doc, projection));
      });

      resolve(payload);
    });
  }

  /**
   * Find and update doc by `id`
   * @param {string} _id Doc _id
   * @param update - New document / update query (default `{}`)
   * @param projection - Projection array
   */
  updateById(
    _id: string,
    update: Update = {},
    projection?: Projection
  ): Promise<Partial<T> | null> {
    return new Promise(resolve => {
      if (!isId(_id)) throw new Error(INVALID_ID(_id));
      if (!isUpdate(update)) throw new Error(INVALID_UPDATE(update));

      const doc = this.map[_id];
      if (doc && !doc.$deleted) {
        const newDoc = {
          ...hasOperators(update) ?
            modify(doc, update) :
            update as T,
          _id
        };
        this.map[_id] = newDoc;

        return resolve(project(newDoc, projection));
      }
      return resolve(null);
    });
  }

  /**
   * Find and update doc(s) by `query`
   * @param {object} query - List of doc `_id`'s / query object (default `{}`)
   * @param {object} update - New document / update query (default `{}`)
   * @param {string[]} projection - Projection array
   */
  async update(
    query: string[] | Query,
    update: Update = {},
    projection?: Projection
  ): Promise<Partial<T>[]> {
    if (isIdArray(query)) {
      try {
        const docs = await Promise
          .all(query.map(id => this.updateById(id, update, projection)))
          .then(result => result.flatMap(i => (i ? [i] : [])));
        return Promise.resolve(docs);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return new Promise(resolve => {
      if (!isQuery(query)) throw new Error(INVALID_QUERY(query));
      if (!isUpdate(update)) throw new Error(INVALID_UPDATE(update));

      const payload: Partial<T>[] = [];
      this.list.forEach(_id => {
        const doc = this.map[_id];
        if (isQueryMatch(doc, query)) {
          const newDoc = {
            ...hasOperators(update) ?
              modify(doc, update) :
              update as T,
            _id
          };
          this.map[_id] = newDoc;
          payload.push(project(newDoc, projection));
        }
      });

      resolve(payload);
    });
  }

  /**
   * Find and delete doc by `_id`
   * @param {string} _id Doc _id
   */
  deleteById(_id: string): Promise<number> {
    return new Promise(resolve => {
      if (!isId(_id)) throw new Error(INVALID_ID(_id));

      const doc = this.map[_id];
      if (doc && !doc.$deleted) {
        this.map[_id] = { ...doc, $deleted: true };
        return resolve(1);
      }

      return resolve(0);
    });
  }

  /**
   * Find and delete doc(s) by `query`
   * @param {object} query - List of doc `_id`'s / query object (default `{}`)
   */
  async delete(query: string[] | Query): Promise<number> {
    if (isIdArray(query)) {
      try {
        const docs = await Promise
          .all((query).map(id => this.deleteById(id)))
          .then(result => result.reduce((acc, cur) => acc + cur, 0));
        return Promise.resolve(docs);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return new Promise(resolve => {
      if (!isQuery(query)) throw new Error(INVALID_QUERY(query));

      let payload = 0;
      this.list.forEach(_id => {
        const doc = this.map[_id];

        if (isQueryMatch(doc, query)) {
          this.map[_id] = { ...doc, $deleted: true };
          payload += 1;
        }
      });

      resolve(payload);
    });
  }

  /** Drop database */
  drop() {
    this.flush();
    if (this.file) this.persist();
  }
}
