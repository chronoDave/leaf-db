const { assert } = require('chai');
const fse = require('fs-extra');
const path = require('path');

const Datastore = require('../src/datastore');

describe('Datastore', () => {
  it('should create a database in memory by default', () => {
    this.db = new Datastore();

    assert.isObject(this.db.data);
    assert.isEmpty(this.db.data);
    assert.isFalse(fse.existsSync(this.file));
  });

  it('should create a persistent database if root is passed', () => {
    const file = path.resolve(__dirname, 'db.txt');

    this.db = new Datastore({ root: __dirname });

    assert.isTrue(fse.existsSync(file));

    fse.removeSync(file);
  });

  it('should accept custom file name', () => {
    const name = 'test';
    const file = path.resolve(__dirname, `${name}.txt`);

    this.db = new Datastore({ root: __dirname, name });

    assert.isTrue(fse.existsSync(file));

    fse.removeSync(file);
  });

  describe('load()', () => {
    beforeEach(() => {
      this.db = new Datastore({ root: __dirname, autoload: false });
      this.file = path.resolve(__dirname, 'db.txt');
    });

    afterEach(() => { fse.removeSync(this.file); });

    it('should parse valid persistent data', () => {
      const data = { _id: 1 };

      fse.writeFileSync(this.file, JSON.stringify(data));

      const corrupt = this.db.load();

      assert.isObject(this.db.data);
      assert.deepStrictEqual(this.db.data[data._id], data);
      assert.isEmpty(corrupt);
    });

    it('should parse empty file', () => {
      fse.writeFileSync(this.file, '');

      const corrupt = this.db.load();

      assert.isObject(this.db.data);
      assert.isEmpty(this.db.data);
      assert.isEmpty(corrupt);
    });

    it('should ignore corrupt data', () => {
      const valid = { _id: 1 };
      const invalid = [{ _id: 2 }, '2', [1], 3, {}, JSON.stringify({ id: 3 })];
      // Invalid and null get written as '', so not invalid (but ignored)
      const data = [JSON.stringify(valid), ...invalid, null, undefined];

      fse.writeFileSync(this.file, data.join('\n'));

      const corrupt = this.db.load();

      assert.isObject(this.db.data);
      assert.strictEqual(Object.keys(this.db.data).length, 1);
      assert.deepStrictEqual(this.db.data[valid._id], valid);
      assert.strictEqual(corrupt.length, invalid.length);
    });

    it('should throw on corrupt data if strict is enabled', () => {
      this.db.strict = true;

      const valid = { _id: 1 };
      const invalid = [{ _id: 2 }, '2', [1], 3, {}, JSON.stringify({ id: 3 })];
      const data = [JSON.stringify(valid), ...invalid, null, undefined];

      fse.writeFileSync(this.file, data.join('\n'));

      try {
        this.db.load();
        assert.fail();
      } catch (err) {
        // Success
      }
    });
  });

  describe('persist()', () => {
    beforeEach(() => {
      this.db = new Datastore({ root: __dirname });
      this.file = path.resolve(__dirname, 'db.txt');
    });

    afterEach(() => { fse.removeSync(this.file); });

    it('should persist', () => {
      this.db.data = {
        1: { _id: 1 },
        2: { _id: 2 },
        3: { _id: 3 }
      };
      this.db.persist();

      const data = fse.readFileSync(this.file, 'utf-8');
      assert.strictEqual(Object.keys(this.db.data).length, data.split('\n').length);
    });

    it('should remove deleted data', () => {
      this.db.data = {
        1: { _id: 1, $deleted: true },
        2: { _id: 2 },
        3: { _id: 3 }
      };
      this.db.persist();

      const data = fse.readFileSync(this.file, 'utf-8');
      assert.strictEqual(Object.keys(this.db.data).length - 1, data.split('\n').length);
    });

    it('should ignore corrupt data', () => {
      this.db.data = {
        1: { _id: 1, $deleted: true },
        2: { _id: 2 },
        3: null
      };
      this.db.persist();

      const data = fse.readFileSync(this.file, 'utf-8');
      assert.strictEqual(1, data.split('\n').length);
    });

    it('should throw if data contains corrupt data', () => {
      this.db.strict = true;
      this.db.data = {
        1: { _id: 1, $deleted: true },
        2: { _id: 2 },
        3: null
      };

      try {
        this.db.persist();
        assert.fail();
      } catch (err) {
        // Success
      }
    });
  });

  describe('create()', () => {
    beforeEach(() => {
      this.db = new Datastore({ root: __dirname, strict: true });
      this.file = path.resolve(__dirname, 'db.txt');
    });

    afterEach(() => { fse.removeSync(this.file); });

    it('should reject if newDoc already exists', async () => {
      this.db.data[1] = { _id: 1 };

      try {
        await this.db.create({ _id: 1 });
        assert.fail();
      } catch (err) {
        // Success
      }
    });

    it('should insert single doc', async () => {
      const payload = { _id: 1, data: 'valid' };

      const inserted = await this.db.create(payload);

      assert.strictEqual(inserted, 1);
      assert.deepStrictEqual(this.db.data[payload._id], payload);
    });

    it('should insert single doc and persist if writeToDisk is true', async () => {
      const payload = { _id: 1, data: 'valid' };

      const inserted = await this.db.create(payload, { writeToDisk: true });

      assert.strictEqual(inserted, 1);
      assert.deepStrictEqual(this.db.data[payload._id], payload);

      const data = fse.readFileSync(this.file, 'utf-8').split('\n');

      assert.strictEqual(data.length, 2); // [payload, '\n']
      assert.deepStrictEqual(data[0], JSON.stringify(payload));
    });

    it('should insert multiple docs', async () => {
      const payload = [{ _id: 1, data: 'valid' }, { _id: 2, data: 'valid' }];

      const inserted = await this.db.create(payload);

      assert.strictEqual(inserted, 2);
      assert.deepStrictEqual(this.db.data[payload[0]._id], payload[0]);
    });

    it('should ignore invalid items if strict is false', async () => {
      const valid = { _id: 1, valid: true };
      const payload = [
        1,
        null,
        undefined,
        [],
        true,
        { valid: true },
        '',
        () => null,
        valid
      ];

      this.db.strict = false;
      const inserted = await this.db.create(payload);

      assert.strictEqual(inserted, 2);
    });
  });

  describe('read()', () => {
    beforeEach(() => {
      this.db = new Datastore({ root: __dirname });
      this.data = {
        1: { _id: 1, a: 1, valid: true },
        2: { _id: 2, b: 2, valid: false },
        3: { _id: 3, c: 3, valid: true }
      };
      this.db.data = this.data;
      this.file = path.resolve(__dirname, 'db.txt');
    });

    afterEach(() => { fse.removeSync(this.file); });

    it('should reject on invalid query', async () => {
      try {
        await this.db.read(null);
        assert.fail();
      } catch (err) {
        // Success
      }
    });

    it('should return first doc on empty query', async () => {
      const newDoc = await this.db.read();

      assert.isArray(newDoc);
      assert.deepStrictEqual(newDoc[0], this.data[1]);
    });

    it('should return empty array if query does not match', async () => {
      const newDoc = await this.db.read({ d: 4 });

      assert.isArray(newDoc);
      assert.strictEqual(newDoc.length, 0);
    });

    it('should return all docs if query is empty and multi is true', async () => {
      const newDocs = await this.db.read({}, { multi: true });

      assert.isArray(newDocs);
      assert.strictEqual(newDocs.length, Object.keys(this.data).length);
      assert.deepStrictEqual(newDocs[0], this.data[1]);
    });

    it('should return first matching doc if query matches', async () => {
      const newDoc = await this.db.read({ a: 1 });

      assert.isArray(newDoc);
      assert.strictEqual(newDoc.length, 1);
      assert.deepStrictEqual(newDoc[0], this.data[1]);
    });

    it('should return first matching doc if _id matches', async () => {
      const newDoc = await this.db.read({ _id: 1 });

      assert.isArray(newDoc);
      assert.strictEqual(newDoc.length, 1);
      assert.deepStrictEqual(newDoc[0], this.data[1]);
    });

    it('should return all matching docs if query matches and multi is true', async () => {
      const newDocs = await this.db.read({ valid: true }, { multi: true });

      assert.isArray(newDocs);
      assert.strictEqual(newDocs.length, 2);
      assert.deepStrictEqual(newDocs[0], this.data[1]);
    });
  });

  describe('update()', () => {
    beforeEach(() => {
      this.db = new Datastore({ root: __dirname });
      this.data = {
        1: { _id: 1, a: 1, valid: true },
        2: { _id: 2, b: 2, valid: false },
        3: { _id: 3, c: 3, valid: true }
      };
      this.db.data = this.data;
      this.file = path.resolve(__dirname, 'db.txt');
    });

    afterEach(() => { fse.removeSync(this.file); });

    it('should reject on invalid query', async () => {
      try {
        await this.db.update(null);
        assert.fail();
      } catch (err) {
        // Success
      }
    });

    it('should reject on invalid update', async () => {
      try {
        await this.db.update({}, null);
        assert.fail();
      } catch (err) {
        // Success
      }
    });

    it('should reject on mixed modifiers', async () => {
      try {
        await this.db.update({}, { a: 1, $mocha: true });
        assert.fail();
      } catch (err) {
        // Success
      }
    });

    it('should update first doc if no query and update are provided', async () => {
      const updated = await this.db.update();

      assert.strictEqual(updated, 1);
      assert.strictEqual(this.db.data.length, this.data.length);
      assert.hasAllKeys(this.db.data[1], '_id');
    });

    it('should update matching doc if _id is provided', async () => {
      const updated = await this.db.update({ _id: 2 });

      assert.strictEqual(updated, 1);
      assert.strictEqual(this.db.data.length, this.data.length);
      assert.hasAllKeys(this.db.data[2], '_id');
    });

    it('should update matching docs if query is provided and multi is true', async () => {
      const updated = await this.db.update({ valid: true }, { invalid: true }, { multi: true });

      assert.strictEqual(updated, 2);
      assert.strictEqual(this.db.data.length, this.data.length);
      assert.hasAllKeys(this.db.data[1], ['_id', 'invalid']);
    });

    it('should accept modifiers', async () => {
      const updated = await this.db.update(
        { valid: true },
        { $inc: { a: 1 } },
        { multi: true }
      );

      assert.strictEqual(updated, 2);
      assert.strictEqual(this.db.data.length, this.data.length);
      assert.strictEqual(this.db.data[1].a, 2);
      assert.isUndefined(this.db.data[3].a);
    });
  });

  describe('delete()', () => {
    beforeEach(() => {
      this.db = new Datastore({ root: __dirname });
      this.data = {
        1: { _id: 1, a: 1, valid: true },
        2: { _id: 2, b: 2, valid: false },
        3: { _id: 3, c: 3, valid: true }
      };
      this.db.data = this.data;
      this.file = path.resolve(__dirname, 'db.txt');
    });

    afterEach(() => { fse.removeSync(this.file); });

    it('should reject on invalid query', async () => {
      try {
        await this.db.delete(null);
        assert.fail();
      } catch (err) {
        // Success
      }
    });

    it('should delete first doc on empty query', async () => {
      const deleted = await this.db.delete();

      assert.strictEqual(deleted, 1);
      assert.strictEqual(Object.keys(this.db.data).length, Object.keys(this.data).length);
      assert.hasAnyKeys(this.db.data[1], '$deleted');
    });

    it('should not delete docs if query does not match', async () => {
      const deleted = await this.db.delete({ d: 4 });

      assert.strictEqual(deleted, 0);
      assert.strictEqual(Object.keys(this.db.data).length, Object.keys(this.data).length);
      assert.doesNotHaveAnyDeepKeys(this.db.data);
    });

    it('should delete all docs if query is empty and multi is true', async () => {
      const deleted = await this.db.delete({}, { multi: true });

      assert.strictEqual(deleted, Object.keys(this.data).length);
      assert.strictEqual(Object.keys(this.db.data).length, Object.keys(this.data).length);
      for (let i = 0, v = Object.values(this.db.data); i < v.length; i += 1) {
        assert.hasAnyKeys(v[i], '$deleted');
      }
    });

    it('should delete first matching doc if query matches', async () => {
      const deleted = await this.db.delete({ a: 1 });

      assert.strictEqual(deleted, 1);
      assert.strictEqual(Object.keys(this.db.data).length, Object.keys(this.data).length);
      assert.hasAnyKeys(this.db.data[1], '$deleted');
    });

    it('should delete first matching doc if _id matches', async () => {
      const deleted = await this.db.delete({ _id: 1 });

      assert.strictEqual(deleted, 1);
      assert.strictEqual(Object.keys(this.db.data).length, Object.keys(this.data).length);
      assert.hasAnyKeys(this.db.data[1], '$deleted');
    });

    it('should delete all matching docs if query matches and multi is true', async () => {
      const deleted = await this.db.delete({ valid: true }, { multi: true });

      assert.strictEqual(deleted, 2);
      assert.strictEqual(Object.keys(this.db.data).length, Object.keys(this.data).length);
      assert.hasAnyKeys(this.db.data[1], '$deleted');
      assert.hasAnyKeys(this.db.data[3], '$deleted');
    });
  });
});
