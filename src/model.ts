import fs, { PathLike } from 'fs';
import path from 'path';

// Types
import {
  OneOrMore,
  Doc,
  PartialDocs,
  Projection,
  Query,
  Update
} from './types';

// Modifiers
import { docModify, docProject } from './modifiers';

// Utils
import { generateUid, toArray } from './utils';

// Validation
import {
  isObject,
  isEmptyObject,
  isQueryMatch,
  hasModifiers,
  isInvalidDoc,
  hasMixedModifiers
} from './validation';

class LeafDB {
  root?: string;
  strict: boolean;
  file?: PathLike;
  data: Record<string, Doc>;

  constructor(
    name: string,
    options: {
      root?: string,
      autoload?: boolean,
      strict?: boolean
    } = {}
  ) {
    this.root = options.root;
    this.strict = !!options.strict;

    if (this.root) fs.mkdirSync(this.root, { recursive: true });

    this.data = {};
    this.file = (this.root && name) && path.resolve(this.root, `${name}.txt`);

    if (
      this.root &&
      (typeof options.autoload === 'undefined' ? true : options.autoload)
    ) this.load();
  }

  /**
   * Initialize database
   * @returns {string[]} List of corrupt items
   * */
  load() {
    const corrupted: string[] = [];

    if (!this.file) return corrupted;

    if (!this.root) {
      throw new Error('Cannot load file data with an in-memory database');
    }

    if (fs.existsSync(this.file)) {
      this.data = {};

      const data = fs
        .readFileSync(this.file, 'utf-8')
        .split('\n');

      for (let i = 0; i < data.length; i += 1) {
        const raw = data[i];

        if (raw && raw.length > 0) {
          try {
            const doc = JSON.parse(raw, (_, value) => (typeof value !== 'string' ?
              value :
              value
                .replace(/\\/g, '\u005c')
                .replace(/"/g, '\u0022')));

            if (!doc._id) throw new Error(`Missing field '_id': ${doc}`);

            this.data[doc._id] = doc;
          } catch (err) {
            if (this.strict) throw err;

            corrupted.push(raw);
          }
        }
      }
    } else {
      fs.writeFileSync(this.file, '');
    }

    return corrupted;
  }

  /**
   * Persist database
   * @param {object} data - Hash table (default `this.data`)
   * */
  persist(data = this.data) {
    if (!this.file) {
      throw new Error('Tried to call `persist()` in memory mode');
    }

    const payload = [];

    for (let i = 0, docs = Object.values(data); i < docs.length; i += 1) {
      try {
        const doc = docs[i];

        if (!doc.$deleted) payload.push(JSON.stringify(doc));
      } catch (err) {
        if (this.strict) throw err;
      }
    }

    fs.writeFileSync(this.file, payload.join('\n'));
  }

  /**
   * Insert new document(s)
   * @param {object|object[]} newDocs
   * @param {object} options
   * @param {boolean} options.persist - Should inserted docs be written to disk? (default `false`)
   * */
  insert(newDocs: OneOrMore<Partial<Doc>>, { persist = false } = {}): Promise<Doc[]> {
    return new Promise(resolve => {
      if (
        !Array.isArray(newDocs) &&
        !isObject(newDocs)
      ) throw new Error(`Invalid newDocs: ${JSON.stringify(newDocs)}`);

      const inserted: Doc[] = [];
      for (let i = 0, a = toArray(newDocs); i < a.length; i += 1) {
        const newDoc = a[i];

        if (!isObject(newDoc)) {
          throw new Error(`newDoc is not an object (${typeof newDoc}): ${JSON.stringify(newDoc)}`);
        }

        if (isInvalidDoc(newDoc)) {
          throw new Error(`newDoc is not a valid document: ${JSON.stringify(newDoc)}`);
        }

        if (!newDoc._id) newDoc._id = generateUid();

        if (this.data[newDoc._id]) {
          throw new Error(`'_id' already exists: ${newDoc._id}, ${JSON.stringify(this.data[newDoc._id])}`);
        }

        inserted.push(newDoc);
      }

      for (let i = 0; i < inserted.length; i += 1) {
        const newDoc = inserted[i];
        this.data[newDoc._id] = newDoc;
      }

      if (persist) this.persist();

      resolve(inserted);
    });
  }

  /**
   * Find doc(s) matching `_id`
   * @param {string|string[]} _id - Doc _id
   * @param {string[]} projection - Projection array (default `null`)
   * */
  findById(_id: OneOrMore<string>, projection: Projection = null): Promise<PartialDocs> {
    return new Promise(resolve => {
      const payload: PartialDocs = [];
      for (let i = 0, keys = toArray(_id); i < keys.length; i += 1) {
        const key = keys[i];

        if (!key || typeof key !== 'string') {
          throw new Error(`Invalid _id: ${key}`);
        }

        const doc = this.data[key];

        if (doc && !doc.$deleted) payload.push(docProject(doc, projection));
      }

      resolve(payload);
    });
  }

  /**
   * Find all documents matching `query`
   * @param {string|object} query - Query object (default `{}`)
   * @param {string[]} projection - Projection array (default `null`)
   */
  find(query: Query = {}, projection: Projection = null): Promise<PartialDocs> {
    return new Promise(resolve => {
      if (!query || !isObject(query)) throw new Error(`Invalid query: ${JSON.stringify(query)}`);

      const payload: PartialDocs = [];
      for (let i = 0, data = Object.values(this.data); i < data.length; i += 1) {
        const doc = data[i];

        if (!doc.$deleted) {
          if (isEmptyObject(query) || isQueryMatch(doc, query)) {
            payload.push(docProject(doc, projection));
          }
        }
      }

      resolve(payload);
    });
  }

  /**
   * Update single doc matching `_id`
   * @param {string} _id
   * @param {object} update - New document (default `{}`) / Update query
   * @param {object} options
   * @param {string[]} options.projection - Projection array (default `null`)
   * @param {boolean} options.persist - Should inserted docs be written to disk? (default `false`)
  */
  updateById(
    _id: OneOrMore<string>,
    update: Update = {},
    options: {
      projection: Projection,
      persist: boolean
    } = {
      projection: null,
      persist: false
    }
  ): Promise<PartialDocs> {
    return new Promise(resolve => {
      if (
        !isObject(update) ||
        update._id ||
        hasMixedModifiers(update) ||
        (!hasModifiers(update) && isInvalidDoc(update))
      ) throw new Error(`Invalid update: ${JSON.stringify(update)}`);

      const payload: PartialDocs = [];
      for (let i = 0, keys = toArray(_id); i < keys.length; i += 1) {
        const key = keys[i];

        if (!key || typeof key !== 'string') throw new Error(`Invalid _id: ${key}`);

        const doc = this.data[key];

        if (doc && !doc.$deleted) {
          const newDoc = hasModifiers(update) ?
            docModify(doc, update) :
            update;

          this.data[key] = { ...newDoc, _id: key };
          payload.push(docProject({ ...newDoc, _id: key }, options.projection));
        }
      }

      if (options.persist) this.persist();

      resolve(payload);
    });
  }

  /**
   * Update documents matching `query`
   * @param {string|object} query - Query object (default `{}`)
   * @param {object} update - New document (default `{}`) / Update query
   * @param {object} options
   * @param {string[]} options.projection - Projection array (default `null`)
   * @param {boolean} options.persist - Should inserted docs be written to disk? (default `false`)
   */
  update(
    query: Query = {},
    update: Update = {},
    options: {
      projection: Projection,
      persist: boolean
    } = {
      projection: null,
      persist: false
    }
  ): Promise<PartialDocs> {
    return new Promise(resolve => {
      if (!isObject(query)) throw new Error(`Invalid query: ${JSON.stringify(query)}`);

      if (
        !isObject(update) ||
        update._id ||
        hasMixedModifiers(update) ||
        (!hasModifiers(update) && isInvalidDoc(update))
      ) throw new Error(`Invalid update: ${JSON.stringify(update)}`);

      const payload: PartialDocs = [];
      for (let i = 0, k = Object.keys(this.data); i < k.length; i += 1) {
        const _id = k[i];
        const doc = this.data[_id];

        if (!doc.$deleted && isQueryMatch(doc, query)) {
          const newDoc = hasModifiers(update) ?
            docModify(doc, update) :
            update;

          this.data[_id] = { ...newDoc, _id };
          payload.push(docProject({ ...newDoc, _id }, options.projection));
        }
      }

      if (options.persist) this.persist();

      resolve(payload);
    });
  }

  /**
   * Delete doc matching `_id`
   * @param {string} _id
   * @param {object} options
   * @param {boolean} options.persist - Should inserted docs be written to disk? (default `false`)
  */
  deleteById(_id: OneOrMore<string>, { persist = false } = {}): Promise<number> {
    return new Promise(resolve => {
      let deleted = 0;
      for (let i = 0, keys = toArray(_id); i < keys.length; i += 1) {
        const key = keys[i];

        if (!key || typeof key !== 'string') throw new Error(`Invalid _id: ${key}`);

        const doc = this.data[key];

        if (doc && !doc.$deleted) {
          this.data[key] = { ...doc, $deleted: true };
          deleted += 1;
        }
      }

      if (persist) this.persist();

      resolve(deleted);
    });
  }

  /**
   * Delete documents matching `query`
   * @param {*} query - Query object (default `{}`)
   * @param {object} options
   * @param {boolean} options.persist - Should inserted docs be written to disk? (default `false`)
   */
  delete(query: Query = {}, { persist = false } = {}): Promise<number> {
    return new Promise(resolve => {
      if (!isObject(query)) throw new Error(`Invalid query: ${JSON.stringify(query)}`);

      let removed = 0;
      for (let i = 0, k = Object.keys(this.data); i < k.length; i += 1) {
        const _id = k[i];
        const doc = this.data[_id];

        if (!doc.$deleted && isQueryMatch(doc, query)) {
          this.data[_id] = { ...doc, $deleted: true };
          removed += 1;
        }
      }

      if (persist) this.persist();

      resolve(removed);
    });
  }

  /** Drop database */
  drop() {
    this.data = {};
    if (this.file) this.persist();
  }
}

export = LeafDB;
