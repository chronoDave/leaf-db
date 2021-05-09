import fs, { PathLike } from 'fs';
import path from 'path';

// Types
import {
  OneOrMore,
  Doc,
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
  isId,
  isEmptyObject,
  isQueryMatch,
  hasModifiers,
  isInvalidDoc,
  hasMixedModifiers
} from './validation';

export default class LeafDB {
  root?: string;
  strict: boolean;
  file?: PathLike;

  private map: Record<string, Doc>;
  private list: Set<string>;

  constructor(options: {
    name?: string,
    root?: string,
    disableAutoload?: boolean,
    strict?: boolean
  } = {}) {
    this.root = options.root;
    this.strict = !!options.strict;

    if (this.root) fs.mkdirSync(this.root, { recursive: true });

    this.map = {};
    this.list = new Set();
    this.file = (this.root && options.name) && path.resolve(this.root, `${options.name}.txt`);

    if (this.root && !options.disableAutoload) this.load();
  }

  /** Initialize data */
  private flush() {
    this.map = {};
    this.list = new Set();
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
      this.flush();

      const data = fs
        .readFileSync(this.file, 'utf-8')
        .split('\n');

      for (let i = 0; i < data.length; i += 1) {
        const raw = data[i];

        if (raw && raw.length > 0) {
          try {
            const doc = JSON.parse(raw);

            if (!doc._id) throw new Error(`Missing field '_id': ${doc}`);

            this.list.add(doc._id);
            this.map[doc._id] = doc;
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

  /** Persist database */
  persist() {
    if (!this.file) {
      throw new Error('Tried to call `persist()` in memory mode');
    }

    const payload: string[] = [];

    this.list.forEach(_id => {
      try {
        const doc = this.map[_id];

        if (!doc.$deleted) payload.push(JSON.stringify(doc));
      } catch (err) {
        if (this.strict) throw err;
      }
    });

    fs.writeFileSync(this.file, payload.join('\n'));
  }

  /**
   * Insert new document(s)
   * @param {object|object[]} newDocs
   * @param {object} options
   * @param {boolean} options.persist - Should inserted docs be written to disk? (default `false`)
   * */
  insert(payload: OneOrMore<Doc>, { persist = false } = {}): Promise<Doc[]> {
    return new Promise(resolve => {
      if (
        !Array.isArray(payload) &&
        !isObject(payload)
      ) throw new Error(`Invalid payload: ${JSON.stringify(payload)}`);

      const inserted: Doc[] = [];
      const newDocs: Doc[] = toArray(payload);

      for (let i = 0; i < newDocs.length; i += 1) {
        const newDoc = newDocs[i];

        if (!isObject(newDoc)) {
          throw new Error(`newDoc is not an object (${typeof newDoc}): ${JSON.stringify(newDoc)}`);
        }

        if (isInvalidDoc(newDoc)) {
          throw new Error(`newDoc is not a valid document: ${JSON.stringify(newDoc)}`);
        }

        if (!newDoc._id) {
          newDoc._id = generateUid();
        } else if (this.list.has(newDoc._id)) {
          throw new Error(`'_id' already exists: ${newDoc._id}`);
        }

        this.list.add(newDoc._id);
        this.map[newDoc._id] = newDoc;

        inserted.push(newDoc);
      }

      if (persist) this.persist();

      resolve(inserted);
    });
  }

  /**
   * Find doc(s) matching `_id`
   * @param {string|string[]} query - Doc _id
   * @param {string[]} projection - Projection array (default `null`)
   * */
  findById(query: OneOrMore<string>, projection: Projection = null): Promise<Partial<Doc>[]> {
    return new Promise(resolve => {
      const payload: Partial<Doc>[] = [];
      const _ids: string[] = toArray(query);

      for (let i = 0; i < _ids.length; i += 1) {
        const _id = _ids[i];

        if (!isId(_id)) throw new Error(`Invalid _id: ${_id}`);

        const doc = this.map[_id];

        if (doc && !doc.$deleted) payload.push(docProject(doc, projection));
      }

      resolve(payload);
    });
  }

  /**
   * Find all documents matching `query`
   * @param {object} query - Query object (default `{}`)
   * @param {string[]} projection - Projection array (default `null`)
   */
  find(query: Query = {}, projection: Projection = null): Promise<Partial<Doc>[]> {
    return new Promise(resolve => {
      if (!query || !isObject(query)) throw new Error(`Invalid query: ${JSON.stringify(query)}`);

      const payload: Partial<Doc>[] = [];

      this.list.forEach(_id => {
        const doc = this.map[_id];

        if (!doc.$deleted) {
          if (isEmptyObject(query) || isQueryMatch(doc, query)) {
            payload.push(docProject(doc, projection));
          }
        }
      });

      resolve(payload);
    });
  }

  /**
   * Update single doc matching `_id`
   * @param {string|string[]} query - Doc _id
   * @param {object} update - New document (default `{}`) / Update query
   * @param {object} options
   * @param {string[]} options.projection - Projection array (default `null`)
   * @param {boolean} options.persist - Should inserted docs be written to disk? (default `false`)
  */
  updateById(
    query: OneOrMore<string>,
    update: Update = {},
    options: {
      projection: Projection,
      persist: boolean
    } = {
      projection: null,
      persist: false
    }
  ): Promise<Partial<Doc>[]> {
    return new Promise(resolve => {
      if (
        !isObject(update) ||
        update._id ||
        hasMixedModifiers(update) ||
        (!hasModifiers(update) && isInvalidDoc(update))
      ) throw new Error(`Invalid update: ${JSON.stringify(update)}`);

      const payload: Partial<Doc>[] = [];
      const _ids: string[] = toArray(query);

      for (let i = 0; i < _ids.length; i += 1) {
        const _id = _ids[i];

        if (!isId(_id)) throw new Error(`Invalid _id: ${_id}`);

        const doc = this.map[_id];

        if (doc && !doc.$deleted) {
          const newDoc = hasModifiers(update) ?
            docModify(doc, update) :
            update;

          this.map[_id] = { ...newDoc, _id };
          payload.push(docProject({ ...newDoc, _id }, options.projection));
        }
      }

      if (options.persist) this.persist();

      resolve(payload);
    });
  }

  /**
   * Update documents matching `query`
   * @param {object} query - Query object (default `{}`)
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
  ): Promise<Partial<Doc>[]> {
    return new Promise(resolve => {
      if (!isObject(query)) throw new Error(`Invalid query: ${JSON.stringify(query)}`);

      if (
        !isObject(update) ||
        update._id ||
        hasMixedModifiers(update) ||
        (!hasModifiers(update) && isInvalidDoc(update))
      ) throw new Error(`Invalid update: ${JSON.stringify(update)}`);

      const payload: Partial<Doc>[] = [];

      this.list.forEach(_id => {
        const doc = this.map[_id];

        if (!doc.$deleted && isQueryMatch(doc, query)) {
          const newDoc = hasModifiers(update) ?
            docModify(doc, update) :
            update;

          this.map[_id] = { ...newDoc, _id };
          payload.push(docProject({ ...newDoc, _id }, options.projection));
        }
      });

      if (options.persist) this.persist();

      resolve(payload);
    });
  }

  /**
   * Delete doc matching `_id`
   * @param {string} query - Doc _id
   * @param {object} options
   * @param {boolean} options.persist - Should inserted docs be written to disk? (default `false`)
  */
  deleteById(query: OneOrMore<string>, { persist = false } = {}): Promise<number> {
    return new Promise(resolve => {
      let payload = 0;
      const _ids = toArray(query);

      for (let i = 0; i < _ids.length; i += 1) {
        const _id = _ids[i];

        if (!isId(_id)) throw new Error(`Invalid _id: ${_id}`);

        const doc = this.map[_id];

        if (doc && !doc.$deleted) {
          this.map[_id] = { ...doc, $deleted: true };
          payload += 1;
        }
      }

      if (persist) this.persist();

      resolve(payload);
    });
  }

  /**
   * Delete documents matching `query`
   * @param {object} query - Query object (default `{}`)
   * @param {object} options
   * @param {boolean} options.persist - Should inserted docs be written to disk? (default `false`)
   */
  delete(query: Query = {}, { persist = false } = {}): Promise<number> {
    return new Promise(resolve => {
      if (!isObject(query)) throw new Error(`Invalid query: ${JSON.stringify(query)}`);

      let payload = 0;
      this.list.forEach(_id => {
        const doc = this.map[_id];

        if (!doc.$deleted && isQueryMatch(doc, query)) {
          this.map[_id] = { ...doc, $deleted: true };
          payload += 1;
        }
      });

      if (persist) this.persist();

      resolve(payload);
    });
  }

  /** Drop database */
  drop() {
    this.flush();
    if (this.file) this.persist();
  }
}
