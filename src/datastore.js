const fse = require('fs-extra');
const path = require('path');

// Utils
const {
  getUid,
  toArray,
  objectModify
} = require('./utils');

// Validation
const {
  isObject,
  isEmptyObject,
  isQueryMatch,
  hasModifiers,
  isInvalidDoc,
  hasMixedModifiers
} = require('./validation');

module.exports = class Datastore {
  /**
   * @param {object} options
   * @param {string} options.name - Database filename (default `db`)
   * @param {string} options.root - Database root path (default `null`)
   * @param {boolean} options.autoload - Should database be loaded on creation (default `true`)
   * @param {boolean} options.strict - Should silent errors be thrown (default `false`)
   */
  constructor({
    name = 'db',
    root = null,
    autoload = true,
    strict = false
  } = {}) {
    this.root = root;
    this.strict = strict;
    this.file = null;

    this.data = {};

    if (this.root && name) {
      this.file = path.resolve(this.root, `${name}.txt`);
    }

    if (autoload) this.load();
  }

  /**
   * Initialize database
   * @returns {string[]} List of corrupt items
   * */
  load() {
    const corrupt = [];

    if (!this.file) return corrupt;

    if (this.root) fse.mkdirpSync(this.root);
    if (fse.existsSync(this.file)) {
      const lines = fse.readFileSync(this.file, 'utf-8').split('\n');
      for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];

        if (line === '') continue;

        try {
          const data = JSON.parse(line.replace('\\', '\\\\'));

          if (!data._id) throw new Error(`Missing field '_id': ${line}`);

          this.data[data._id] = data;
        } catch (err) {
          if (this.strict) throw err;

          corrupt.push(line);
        }
      }
    } else {
      fse.writeFileSync(this.file, '', 'utf-8');
    }

    return corrupt;
  }

  /**
   * Persist database
   * @param {object} data - Hash table (default `this.data`)
   * */
  persist(data = this.data) {
    const payload = [];
    for (let i = 0, docs = Object.values(data); i < docs.length; i += 1) {
      try {
        const doc = docs[i];
        if (!doc) throw new Error(`Invalid doc: ${doc}`);
        if (!doc.$deleted) payload.push(JSON.stringify(doc));
      } catch (err) {
        if (this.strict) throw err;
      }
    }
    fse.writeFileSync(
      this.file,
      payload.join('\n'),
      'utf-8'
    );
  }

  /**
   * Insert new document(s)
   * @param {object|object[]} newDocs
   * @param {object} options
   * @param {boolean} options.writeToDisk - Should `create()` write to disk (default `false`)
   * @returns {number} Docs inserted
   */
  async create(newDocs, { writeToDisk = false } = {}) {
    if ((!Array.isArray(newDocs) && !isObject(newDocs)) && this.strict) {
      return Promise.reject(new Error(`Invalid newDocs: ${JSON.stringify(newDocs)}`));
    }

    let inserted = 0;
    for (let i = 0, a = toArray(newDocs); i < a.length; i += 1) {
      const newDoc = a[i];

      if (!isObject(newDoc)) {
        if (this.strict) return Promise.reject(new Error(`newDoc is not an object (${typeof newDoc}): ${JSON.stringify(newDoc)}`));
        continue;
      }

      if (isInvalidDoc(newDoc)) {
        if (this.strict) return Promise.reject(new Error(`newDoc is not a valid document: ${JSON.stringify(newDoc)}`));
        continue;
      }

      if (!newDoc._id) newDoc._id = getUid();
      // Not using else-if in case collision occurs
      if (this.data[newDoc._id]) {
        if (this.strict) return Promise.reject(new Error(`'_id' already exists: ${newDoc._id}, ${JSON.stringify(this.data[newDoc._id])}`));
        continue;
      }

      this.data[newDoc._id] = newDoc;
      if (writeToDisk) fse.appendFileSync(this.file, `${JSON.stringify(newDoc)}\n`);
      inserted += 1;
    }

    return Promise.resolve(inserted);
  }

  /**
   * Find all document(s) matching `query`
   * @param {string|object} query - _id or query object (default `{}`)
   * @param {object} options
   * @param {boolean} options.multi - Can find multiple documents (default `false`)
   */
  async read(query = {}, { multi = false } = {}) {
    try {
      if (!isObject(query) && !typeof query === 'string') {
        return Promise.reject(new Error(`Invalid query: ${JSON.stringify(query)}`));
      }

      if (isEmptyObject(query)) {
        const data = Object.values(this.data);
        return Promise.resolve(multi ? data : [data[0]]);
      }

      if (typeof query === 'string') {
        const doc = this.data[query];
        return Promise.resolve(doc ? [doc] : []);
      }

      if (multi) {
        const docs = Object.values(this.data).filter(item => !item.$deleted && isQueryMatch(item, query));
        return Promise.resolve(docs);
      }

      const doc = Object.values(this.data).find(item => !item.$deleted && isQueryMatch(item, query));
      return Promise.resolve(doc ? [doc] : []);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  /**
   * Update document(s) matching `query`
   * @param {string|object} query - _id or query object (default `{}`)
   * @param {object} update - New document (default `{}`) / Update query
   * @param {object} options
   * @param {boolean} options.multi - Can update multiple documents (default `false`)
   */
  async update(query = {}, update = {}, { multi = false } = {}) {
    try {
      if (!isObject(query) && !typeof query === 'string') {
        return Promise.reject(new Error(`Invalid query: ${JSON.stringify(query)}`));
      }

      if (
        !isObject(update) ||
        update._id ||
        hasMixedModifiers(update) ||
        (!hasModifiers(update) && isInvalidDoc(update))
      ) {
        return Promise.reject(new Error(`Invalid update: ${JSON.stringify(update)}`));
      }

      const updated = [];
      if (typeof query === 'string') {
        const doc = this.data[query];

        if (doc) {
          const newDoc = hasModifiers(update) ?
            objectModify(doc, update) :
            update;

          newDoc._id = doc._id;
          this.data[query] = newDoc;

          updated.push(newDoc);
        }
      } else {
        for (let i = 0, v = Object.values(this.data); i < v.length; i += 1) {
          const doc = v[i];

          if (doc.$deleted || !isQueryMatch(doc, query)) continue;

          const newDoc = hasModifiers(update) ?
            objectModify(doc, update) :
            update;

          newDoc._id = doc._id;
          this.data[newDoc._id] = newDoc;

          updated.push(newDoc);

          if (!multi && updated.length > 0) break;
        }
      }

      for (let i = 0; i < updated.length; i += 1) {
        const doc = updated[i];
        this.data[doc._id] = updated[i];
      }

      return Promise.resolve(updated.length);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  /**
   * Delete document(s) matching `query`
   * @param {string|object} query - _id or query object (default `{}`)
   * @param {object} options
   * @param {boolean} options.multi - Can update multiple documents (default `false`)
   */
  async delete(query = {}, { multi = false } = {}) {
    try {
      if (!isObject(query) && !typeof query === 'string') {
        return Promise.reject(new Error(`Invalid query: ${JSON.stringify(query)}`));
      }

      let removed = 0;
      if (typeof query === 'string') {
        const doc = this.data[query];
        if (doc) {
          doc.$deleted = true;
          removed += 1;
        }
      } else {
        for (let i = 0, v = Object.values(this.data); i < v.length; i += 1) {
          const doc = v[i];

          const canRemove = multi || removed < 1;
          const matches = isEmptyObject(query) || isQueryMatch(doc, query);

          if (canRemove && matches) {
            doc.$deleted = true;
            removed += 1;
          }
        }
      }

      return Promise.resolve(removed);
    } catch (err) {
      return Promise.reject(err);
    }
  }
};
