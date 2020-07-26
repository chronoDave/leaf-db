const fse = require('fs-extra');
const path = require('path');

// Utils
const {
  getUid,
  toArray,
  isObject,
  isEmptyObject,
  equalSome
} = require('./utils');

module.exports = class Datastore {
  /**
   * @param {object} options
   * @param {string} options.root - Database root path
   * @param {string} options.name - Database filename
   * @param {boolean} options.autoLoad - Should database be loaded on creation (default `true`)
   */
  constructor({
    root = null,
    name = null,
    autoLoad = true
  } = {}) {
    this.root = root;
    this.name = name;

    this.file = path.resolve(this.root, `${name}.txt`);
    this.data = [];

    if (autoLoad) this.load();
  }

  /** Initialize database */
  load() {
    try {
      fse.mkdirpSync(this.root);

      const exists = fse.existsSync(this.file);

      if (exists) {
        const raw = fse.readFileSync(this.file, 'utf-8');
        for (let i = 0, data = raw.split('\n'); i < data.length; i += 1) {
          if (data[i] !== '') this.data.push(JSON.parse(data[i]));
        }
      } else {
        fse.writeFileSync(this.file, '', 'utf-8');
      }
    } catch (err) {
      console.error(err);
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
      for (let i = 0, array = toArray(newDocs); i < array.length; i += 1) {
        const newDoc = array[i];

        // Silent fail invalid newDocs
        if (isObject(newDoc)) {
          const payload = { _id: getUid(), ...newDoc };
          const payloadString = `${JSON.stringify(payload)}\n`;

          fse.appendFileSync(this.file, payloadString, 'utf-8');
          inserted.push(payload);
          this.data.push(payload);
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
      if (!isObject(query)) {
        return Promise.reject(new Error(`Invalid query: ${query}`));
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
   * @param {object} newDoc - New document (default `{}`)
   * @param {object} options
   * @param {boolean} options.multi - Can update multiple documents (default `false`)
   */
  async update(query = {}, newDoc = {}, { multi = false } = {}) {
    try {
      if (!isObject(query)) {
        return Promise.reject(new Error(`Invalid query: ${query}`));
      }

      if (!isObject(newDoc)) {
        return Promise.reject(new Error(`Invalid newDoc: ${newDoc}`));
      }

      if (Object.keys(newDoc).includes('_id')) {
        return Promise.reject(new Error(`Cannot update field _id: ${JSON.stringify(newDoc)}`));
      }

      let nUpdated = 0;
      const newDocs = this.data
        .map(item => {
          const canUpdate = multi || nUpdated < 1;
          const matches = isEmptyObject(query) || equalSome(item, query);

          if (canUpdate && matches) {
            nUpdated += 1;
            return { _id: item._id, ...newDoc };
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
      if (!isObject(query)) {
        return Promise.reject(new Error(`Invalid query: ${query}`));
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
