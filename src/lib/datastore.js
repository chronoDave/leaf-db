const fse = require('fs-extra');
const path = require('path');

// Modifiers
const { applyModifier } = require('./modifiers');

// Utils
const {
  getUid,
  toArray,
  isObject,
  isEmptyObject,
  equalSome
} = require('./utils');

// Validation
const {
  hasModifiers,
  isValidQuery,
  isValidUpdate
} = require('./validation');

module.exports = class Datastore {
  /**
   * @param {object} options
   * @param {string} options.root - Database root path
   * @param {string} options.name - Database filename
   * @param {boolean} options.autoLoad - Should database be loaded on creation (default `true`)
   * @param {boolean} options.strict - Should silent errors be thrown (default `false`)
   */
  constructor({
    root = null,
    name = null,
    autoLoad = true,
    strict = false
  } = {}) {
    this.root = root;
    this.name = name;
    this.strict = strict;

    this.file = path.resolve(this.root, `${name}.txt`);
    this.data = [];

    if (autoLoad) this.load();
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
      data.map(item => JSON.stringify(item)).join('\n'),
      'utf-8'
    );
  }

  /**
   * Inserts a new document
   * @param {object|object[]} newDocs
   */
  async create(newDocs) {
    try {
      if (!Array.isArray(newDocs) && !isObject(newDocs)) {
        return Promise.reject(new Error(`Invalid newDocs: ${newDocs}`));
      }

      const inserted = [];
      const array = toArray(newDocs);
      for (let i = 0, l = array.length; i < l; i += 1) {
        const newDoc = array[i];

        if (isObject(newDoc)) {
          if (hasModifiers(newDoc)) {
            return Promise.reject(new Error(`Doc cannot contain modifiers: ${JSON.stringify(newDoc)}`));
          }

          const payload = { _id: getUid(), ...newDoc };
          const payloadString = `${JSON.stringify(payload)}\n`;

          fse.appendFileSync(this.file, payloadString, 'utf-8');
          inserted.push(payload);
          this.data.push(payload);
        } else if (this.strict) {
          // If not strict, silent fail instead
          return Promise.reject(new Error(`Invalid doc: ${newDoc}`));
        }
      }

      return Promise.resolve(inserted);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  /**
   * Find all documents matching `query`
   * @param {object} query - Query object (default `{}`)
   * @param {object} options
   * @param {object} options.multi - Can find multiple documents (default `false`)
   */
  async read(query = {}, { multi = false } = {}) {
    try {
      if (!isValidQuery(query)) {
        return Promise.reject(new Error(`Invalid query: ${JSON.stringify(query)}`));
      }

      if (isEmptyObject(query)) {
        if (multi) return Promise.resolve(this.data);
        return Promise.resolve(this.data[0]);
      }

      if (multi) {
        const docs = this.data.filter(item => equalSome(item, query));
        return Promise.resolve(docs);
      }

      const doc = this.data.find(item => equalSome(item, query));
      return Promise.resolve(doc || null);
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
      if (!isValidQuery(query)) {
        return Promise.reject(new Error(`Invalid query: ${JSON.stringify(query)}`));
      }

      if (!isValidUpdate(update)) {
        return Promise.reject(new Error(`Invalid update: ${JSON.stringify(update)}`));
      }

      let nUpdated = 0;
      const newDocs = this.data
        .map(item => {
          const canUpdate = multi || nUpdated < 1;
          const matches = isEmptyObject(query) || equalSome(item, query);

          if (canUpdate && matches) {
            nUpdated += 1;

            if (hasModifiers(update)) {
              const modified = Object
                .entries(update)
                .map(([modifier, value]) => applyModifier(modifier, value, item))
                .reduce((acc, cur) => ({ ...acc, ...cur }), {});
              return { _id: item._id, ...modified };
            }

            return { _id: item._id, ...update };
          }
          return item;
        });

      this.persist(newDocs);
      this.data = newDocs;

      return Promise.resolve(nUpdated);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  async remove(query = {}, { multi = false } = {}) {
    try {
      if (!isValidQuery(query)) {
        return Promise.reject(new Error(`Invalid query: ${JSON.stringify(query)}`));
      }

      let nRemoved = 0;
      const newDocs = this.data
        .filter(item => {
          const canRemove = multi || nRemoved < 1;
          const matches = isEmptyObject(query) || equalSome(item, query);

          if (canRemove && matches) {
            nRemoved += 1;
            return false;
          }
          return true;
        });

      this.persist(newDocs);
      this.data = newDocs;

      return Promise.resolve(nRemoved);
    } catch (err) {
      return Promise.reject(err);
    }
  }
};
