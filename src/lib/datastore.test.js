const chaiAsPromised = require('chai-as-promised');
const { assert, expect } = require('chai').use(chaiAsPromised);
const fse = require('fs-extra');
const path = require('path');

const Datastore = require('./datastore');

describe('Datastore', () => {
  beforeEach(() => {
    this.db = new Datastore({
      root: __dirname,
      name: 'mocha',
      autoLoad: false
    });
    this.file = path.resolve(__dirname, 'mocha.txt');
  });

  afterEach(() => {
    fse.removeSync(this.file);
  });

  describe('load()', () => {
    it('should load the database', () => {
      this.db.load();

      const exists = fse.existsSync(this.file);

      assert.isTrue(exists);
    });
  });

  describe('parseRaw()', () => {
    it('should parse the database file', () => {
      const data = { id: 'mocha' };
      const raw = JSON.stringify(data);

      this.db.parseRaw(raw);

      assert.isArray(this.db.data);
      assert.deepStrictEqual(this.db.data[0], data);
    });
  });

  describe('persist()', () => {
    it('should persist data', () => {
      const data = [{ a: 1 }, { b: 2 }, { c: 3 }];
      this.db.persist(data);

      const persistent = fse.readFileSync(this.file, 'utf-8');
      assert.strictEqual(persistent.split('\n').length, data.length);
    });

    it('should persist memory', () => {
      const data = [{ a: 1 }, { b: 2 }, { c: 3 }];
      this.db.data = data;

      this.db.persist();

      const persistent = fse.readFileSync(this.file, 'utf-8');
      assert.strictEqual(persistent.split('\n').length, data.length);
    });
  });

  describe('insert()', () => {
    it('should throw an error if no data is provided', () => (
      expect(this.db.insert()).to.be.rejected
    ));

    it('should insert single object', async () => {
      const payload = { data: 'mocha' };

      const newDocs = await this.db.insert(payload);

      assert.isArray(newDocs);
      assert.strictEqual(newDocs.length, 1);
      assert.hasAnyKeys(newDocs[0], payload);
    });

    it('should insert multiple objects', async () => {
      const payload = [{ data: 1 }, { data: 2 }, { data: 3 }];

      const newDocs = await this.db.insert(payload);

      assert.isArray(newDocs);
      assert.strictEqual(newDocs.length, payload.length);
      assert.hasAnyKeys(newDocs[0], payload[0]); // Order should be the same
    });

    it('should silently fail is invalid data is provided', async () => {
      const valid = { valid: true };
      const payload = [
        1,
        null,
        undefined,
        [],
        true,
        '',
        () => null,
        valid
      ];

      const newDocs = await this.db.insert(payload);

      assert.isArray(newDocs);
      assert.strictEqual(newDocs.length, 1);
      assert.hasAnyKeys(newDocs[0], valid);
    });
  });

  describe('find()', () => {
    it('should throw an error on invalid query', () => (
      expect(this.db.find(null)).to.be.rejected
    ));

    it('should return first document on empty query', async () => {
      const data = [{ a: 1 }, { b: 2 }, { c: 3 }];

      await this.db.insert(data);

      const newDoc = await this.db.find();

      assert.isNotArray(newDoc);
      assert.hasAnyKeys(newDoc, data[0]);
    });

    it('should return null if query does not match', async () => {
      const data = [{ a: 1 }, { b: 2 }, { c: 3 }];

      await this.db.insert(data);

      const newDoc = await this.db.find({ d: 4 });

      assert.isNull(newDoc);
    });

    it('should return all documents if query is empty and multi is true', async () => {
      const data = [{ a: 1 }, { b: 2 }, { c: 3 }];

      await this.db.insert(data);

      const newDocs = await this.db.find({}, { multi: true });

      assert.isArray(newDocs);
      assert.strictEqual(newDocs.length, data.length);
      assert.hasAnyKeys(newDocs[0], data[0]);
    });

    it('should return matches documents if multi is true', async () => {
      const data = [{ a: 1 }, { a: 1, b: 2 }, { c: 3 }];

      await this.db.insert(data);

      const newDocs = await this.db.find({ a: 1 }, { multi: true });

      assert.isArray(newDocs);
      assert.strictEqual(newDocs.length, 2);
      assert.hasAnyKeys(newDocs[0], data[0]); // Sample
    });

    it('should return an empty array if query does not match and multi is true', async () => {
      const data = [{ a: 1 }, { a: 1, b: 2 }, { c: 3 }];

      await this.db.insert(data);

      const newDocs = await this.db.find({ d: 1 }, { multi: true });

      assert.isArray(newDocs);
      assert.strictEqual(newDocs.length, 0);
    });
  });

  describe('update()', () => {
    it('should throw an error on invalid query', () => (
      expect(this.db.update(null)).to.be.rejected
    ));

    it('should replace the first entry with empty object (incl. _id) if no query and newDoc are provided', async () => {
      const data = [{ a: 1 }, { b: 2 }, { c: 3 }];

      await this.db.insert(data);

      const nUpdated = await this.db.update();

      assert.strictEqual(nUpdated, 1);
      assert.hasAllKeys(this.db.data[0], '_id'); // Should only contain _id
    });

    it('should replace first entry matching query with empty object (incl. _id)', async () => {
      const data = [{ a: 1 }, { b: 2 }, { c: 3 }];
      const query = { b: 2 };

      await this.db.insert(data);

      const nUpdated = await this.db.update(query);

      assert.strictEqual(nUpdated, 1);
      assert.hasAllKeys(this.db.data[1], '_id');
      assert.hasAllKeys(this.db.data[0], ['a', '_id']);
    });

    it('should replace the first entry matching query with newDoc', async () => {
      const data = [{ a: 1 }, { b: 2 }, { c: 3 }];
      const query = { b: 2 };
      const newDoc = { data: 'mocha' };

      await this.db.insert(data);

      const nUpdated = await this.db.update(query, newDoc);

      assert.strictEqual(nUpdated, 1);
      assert.hasAnyKeys(this.db.data[1], newDoc);
      assert.hasAnyKeys(this.db.data[0], data[0]);
    });

    it('should replace all entries if multi is true', async () => {
      const data = [{ a: 1 }, { b: 2 }, { c: 3 }];
      const newDoc = { data: 'mocha' };

      await this.db.insert(data);

      const nUpdated = await this.db.update({}, newDoc, { multi: true });

      assert.strictEqual(nUpdated, data.length);
      assert.hasAnyKeys(this.db.data[2], newDoc); // Sample test
    });
  });

  describe('remove()', () => {
    it('should throw an error on invalid query', () => (
      expect(this.db.update(null)).to.be.rejected
    ));

    it('should remove the first element on empty query', async () => {
      const data = [{ a: 1 }, { b: 2 }, { c: 3 }];

      await this.db.insert(data);

      const nRemoved = await this.db.remove();

      assert.strictEqual(nRemoved, 1);
      assert.hasAnyKeys(this.db.data[0], data[1]);
    });

    it('should remove the first matching element on query', async () => {
      const data = [{ a: 1 }, { a: 1, b: 2 }, { c: 3 }];

      await this.db.insert(data);

      const nRemoved = await this.db.remove({ a: 1 });

      assert.strictEqual(nRemoved, 1);
      assert.hasAnyKeys(this.db.data[0], data[1]);
    });

    it('should remove no item if query does not match', async () => {
      const data = [{ a: 1 }, { a: 1, b: 2 }, { c: 3 }];

      await this.db.insert(data);

      const nRemoved = await this.db.remove({ d: 1 });

      assert.strictEqual(nRemoved, 0);
      assert.hasAnyKeys(this.db.data[0], data[0]);
    });

    it('should remove all items if no query and multi is true', async () => {
      const data = [{ a: 1 }, { a: 1, b: 2 }, { c: 3 }];

      await this.db.insert(data);

      const nRemoved = await this.db.remove({}, { multi: true });

      assert.strictEqual(nRemoved, data.length);
      assert.strictEqual(this.db.data.length, 0);
    });

    it('should remove matching elements if multi is true', async () => {
      const data = [{ a: 1 }, { a: 1, b: 2 }, { c: 3 }];

      await this.db.insert(data);

      const nRemoved = await this.db.remove({ a: 1 }, { multi: true });

      assert.strictEqual(nRemoved, 2);
      assert.strictEqual(this.db.data.length, 1);
      assert.hasAnyKeys(this.db.data[0], data[2]);
    });

    it('should remove no items if query does not match and multi is true', async () => {
      const data = [{ a: 1 }, { a: 1, b: 2 }, { c: 3 }];

      await this.db.insert(data);

      const nRemoved = await this.db.remove({ d: 1 }, { multi: true });

      assert.strictEqual(nRemoved, 0);
      assert.strictEqual(this.db.data.length, data.length);
    });
  });
});
