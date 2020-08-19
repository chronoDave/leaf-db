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
   * @param {string} options.root - Database root path (default `process.cwd()`)
   * @param {boolean} options.autoload - Should database be loaded on creation (default `true`)
   * @param {boolean} options.strict - Should silent errors be thrown (default `false`)
   */
  constructor({
    name = 'db',
    root = process.cwd(),
    autoload = true,
    strict = false
  } = {}) {
    this.root = root;
    this.name = name;
    this.strict = strict;

    this.file = path.resolve(this.root, `${name}.txt`);
    this.data = [];
    this.ids = [];

    if (autoload) this.load();
  }

  /** Initialize database */
  load() {
    fse.mkdirpSync(this.root);

    const exists = fse.existsSync(this.file);

    if (exists) {
      fse
        .readFileSync(this.file, 'utf-8')
        .split('\n')
        .forEach(line => {
          if (line !== '') this.data.push(JSON.parse(line));
        });
    } else {
      fse.writeFileSync(this.file, '', 'utf-8');
    }
  }

  /**
   * Persist database
   * @param {object[]} data - Array of objects (default `this.data`)
   * */
  persist(data = this.data) {
    fse.writeFileSync(
      this.file,
      data
        .filter(item => !item.$deleted)
        .map(item => JSON.stringify(item))
        .join('\n'),
      'utf-8'
    );
  }

  /**
   * Inserts a new document
   *  - If `strict` is enabled, will fail if any `newDocs` is invalid
   *  - If `strict` is disabled, will only insert valid `newDocs`
   * @param {object|object[]} newDocs
   */
  async create(newDocs) {
    try {
      if (!Array.isArray(newDocs) && !isObject(newDocs) && this.strict) {
        return Promise.reject(new Error(`Invalid newDocs: ${JSON.stringify(newDocs)}`));
      }

      const inserted = [];
      for (let i = 0, a = toArray(newDocs); i < a.length; i += 1) {
        const newDoc = a[i];

        if (
          isObject(newDoc) &&
          !isInvalidDoc(newDoc)
        ) {
          if (!newDoc._id) newDoc._id = getUid();

          if (this.ids[newDoc._id]) {
            return Promise.reject(new Error(`'_id' already exists: ${newDoc._id}`));
          }

          this.ids[newDoc._id] = true;

          fse.appendFileSync(this.file, `${JSON.stringify(newDoc)}\n`);
          inserted.push(newDoc);
        } else if (this.strict) {
          return Promise.reject(new Error(`Invalid newDoc: ${JSON.stringify(newDoc)}`));
        }
      }

      for (let i = 0; i < inserted.length; i += 1) {
        this.data.push(inserted[i]);
      }

      this.persist();

      return Promise.resolve(inserted);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  /**
   * Find all documents matching `query`
   * @param {object} query - Query object (default `{}`)
   * @param {object} options
   * @param {boolean} options.multi - Can find multiple documents (default `false`)
   */
  async read(query = {}, { multi = false } = {}) {
    try {
      if (!isObject(query)) {
        return Promise.reject(new Error(`Invalid query: ${JSON.stringify(query)}`));
      }

      if (isEmptyObject(query)) {
        return Promise.resolve(multi ? this.data : [this.data[0]]);
      }

      if (multi) {
        const docs = this.data.filter(item => !item.$deleted && isQueryMatch(item, query));
        return Promise.resolve(docs);
      }

      const doc = this.data.find(item => !item.$deleted && isQueryMatch(item, query));
      return Promise.resolve(doc ? [doc] : []);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  /**
   * Update document matching `query`
   * @param {object} query - Empty query updates all documents (default `{}`)
   * @param {object} update - New document (default `{}`) / Update query
   * @param {object} options
   * @param {boolean} options.multi - Can update multiple documents (default `false`)
   */
  async update(query = {}, update = {}, { multi = false } = {}) {
    try {
      if (!isObject(query)) {
        return Promise.reject(new Error(`Invalid query: ${JSON.stringify(query)}`));
      }

      if (
        !isObject(update) ||
        hasMixedModifiers(update) ||
        (!hasModifiers(update) && isInvalidDoc(update))
      ) {
        return Promise.reject(new Error(`Invalid update: ${JSON.stringify(update)}`));
      }

      let nUpdated = 0;
      for (let i = 0; i < this.data.length; i += 1) {
        const doc = this.data[i];

        if (this.strict && doc._id) {
          return Promise.reject(new Error(`Cannot modify field '_id': ${doc._id}`));
        }

        if (!doc.$deleted && isQueryMatch(doc, query)) {
          const { _id } = this.data[i];
          const newDoc = hasModifiers(update) ?
            objectModify(doc, update) :
            update;

          this.data[i] = newDoc;
          this.data[i]._id = _id;

          nUpdated += 1;
        }

        if (!multi && nUpdated > 0) break;
      }

      this.persist();

      return Promise.resolve(nUpdated);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  async delete(query = {}, { multi = false } = {}) {
    try {
      if (!isObject(query)) {
        return Promise.reject(new Error(`Invalid query: ${JSON.stringify(query)}`));
      }

      let nRemoved = 0;
      for (let i = 0; i < this.data.length; i += 1) {
        const item = this.data[i];

        const canRemove = multi || nRemoved < 1;
        const matches = isEmptyObject(query) || isQueryMatch(item, query);

        if (canRemove && matches) {
          nRemoved += 1;
          item.$deleted = true;
        }
      }

      this.persist();

      return Promise.resolve(nRemoved);
    } catch (err) {
      return Promise.reject(err);
    }
  }
};
