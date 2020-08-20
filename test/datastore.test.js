const { assert } = require('chai');
const fse = require('fs-extra');
const path = require('path');

const Datastore = require('../src/datastore');

describe('Datastore', () => {
  beforeEach(() => {
    this.db = new Datastore({
      root: __dirname,
      name: 'mocha',
      autoload: true
    });
    this.file = path.resolve(__dirname, 'mocha.txt');
  });

  afterEach(() => {
    fse.removeSync(this.file);
  });

  describe('load()', () => {
    it('should create the database file if file does not exist', () => {
      this.db.load();

      const exists = fse.existsSync(this.file);

      assert.isTrue(exists);
    });

    it('should parse the database file if file exists', () => {
      const data = { id: 'mocha' };
      const raw = JSON.stringify(data);

      fse.writeFileSync(this.file, raw);

      this.db.load();

      assert.isArray(this.db.data);
      assert.deepStrictEqual(this.db.data[0], data);
    });

    it('should parse the database file if it is empty', () => {
      fse.writeFileSync(this.file, '');

      this.db.load();

      assert.isArray(this.db.data);
      assert.isEmpty(this.db.data);
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

  describe('create()', () => {
    it('should resolve if no data is provided', async () => {
      const newDocs = await this.db.create();

      assert.isArray(newDocs);
      assert.strictEqual(newDocs.length, 0);
    });

    it('should resolve if invalid data is provided', async () => {
      const newDocs = await this.db.create(null);

      assert.isArray(newDocs);
      assert.strictEqual(newDocs.length, 0);
    });

    it('should resolve if modifiers are provided', async () => {
      const newDocs = await this.db.create({ $mocha: true });

      assert.isArray(newDocs);
      assert.strictEqual(newDocs.length, 0);
    });

    it('should insert single object', async () => {
      const payload = { data: 'mocha' };

      const newDocs = await this.db.create(payload);

      assert.isArray(newDocs);
      assert.strictEqual(newDocs.length, 1);
      assert.hasAnyKeys(newDocs[0], payload);
    });

    it('should insert multiple objects', async () => {
      const payload = [{ data: 1 }, { data: 2 }, { data: 3 }];

      const newDocs = await this.db.create(payload);

      assert.isArray(newDocs);
      assert.strictEqual(newDocs.length, payload.length);
      assert.hasAnyKeys(newDocs[0], payload[0]); // Order should be the same
    });

    it('should reject on duplicate _ids', async () => {
      this.db.strict = true;

      try {
        await this.db.create([{ _id: 1 }, { _id: 1 }]);
        assert.fail();
      } catch (err) {
        assert.isTrue(true);
      }
    });

    it('should insert valid items and ignore invalid items', async () => {
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

      const newDocs = await this.db.create(payload);

      assert.isArray(newDocs);
      assert.strictEqual(newDocs.length, 1);
      assert.hasAnyKeys(newDocs[0], valid);
    });

    describe('Strict', () => {
      it('should reject if no data is provided', async () => {
        this.db.strict = true;

        try {
          await this.db.create();
          assert.fail();
        } catch (err) {
          assert.isTrue(true);
        }
      });

      it('should reject if invalid data is provided', async () => {
        this.db.strict = true;

        try {
          await this.db.create(null);
          assert.fail();
        } catch (err) {
          assert.isTrue(true);
        }
      });

      it('should reject if modifiers are provided', async () => {
        this.db.strict = true;

        try {
          await this.db.create({ $mocha: true });
          assert.fail();
        } catch (err) {
          assert.isTrue(true);
        }
      });

      it('should reject on invalid items', async () => {
        this.db.strict = true;

        try {
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
          await this.db.create(payload);
        } catch (err) {
          assert.isTrue(true);
        }
      });
    });
  });

  describe('read()', () => {
    it('should reject on invalid query', async () => {
      try {
        await this.db.read(null);
        assert.fail();
      } catch (err) {
        assert.isTrue(true);
      }
    });

    it('should return first document on empty query', async () => {
      const data = [{ a: 1 }, { b: 2 }, { c: 3 }];

      await this.db.create(data);

      const newDoc = await this.db.read();

      assert.isArray(newDoc);
      assert.hasAnyKeys(newDoc[0], data[0]);
    });

    it('should return empty array if query does not match', async () => {
      const data = [{ a: 1 }, { b: 2 }, { c: 3 }];

      await this.db.create(data);

      const newDoc = await this.db.read({ d: 4 });

      assert.isArray(newDoc);
      assert.strictEqual(newDoc.length, 0);
    });

    it('should return all documents if query is empty and multi is true', async () => {
      const data = [{ a: 1 }, { b: 2 }, { c: 3 }];

      await this.db.create(data);

      const newDocs = await this.db.read({}, { multi: true });

      assert.isArray(newDocs);
      assert.strictEqual(newDocs.length, data.length);
      assert.hasAnyKeys(newDocs[0], data[0]);
    });

    it('should return matches documents if multi is true', async () => {
      const data = [{ a: 1 }, { a: 1, b: 2 }, { c: 3 }];

      await this.db.create(data);

      const newDocs = await this.db.read({ a: 1 }, { multi: true });

      assert.isArray(newDocs);
      assert.strictEqual(newDocs.length, 2);
      assert.hasAnyKeys(newDocs[0], data[0]); // Sample
    });

    it('should return an empty array if query does not match and multi is true', async () => {
      const data = [{ a: 1 }, { a: 1, b: 2 }, { c: 3 }];

      await this.db.create(data);

      const newDocs = await this.db.read({ d: 1 }, { multi: true });

      assert.isArray(newDocs);
      assert.strictEqual(newDocs.length, 0);
    });

    it('should return matches if nested query matches', async () => {
      const data = [{ a: { b: { c: [{ d: 1 }] } } }];

      await this.db.create(data);

      const newDocs = await this.db.read({ $gte: { 'a.b.c[0].d': 1 } }, { multi: true });

      assert.isArray(newDocs);
      assert.strictEqual(newDocs.length, 1);
      assert.hasAnyKeys(newDocs[0], data[0]);
    });
  });

  describe('update()', () => {
    it('should reject on invalid query', async () => {
      try {
        await this.db.update(null);
        assert.fail();
      } catch (err) {
        assert.isTrue(true);
      }
    });

    it('should reject on invalid update', async () => {
      try {
        await this.db.update({}, null);
        assert.fail();
      } catch (err) {
        assert.isTrue(true);
      }
    });

    it('should reject on mixed modifiers', async () => {
      try {
        await this.db.update({}, { a: 1, $mocha: true });
        assert.fail();
      } catch (err) {
        assert.isTrue(true);
      }
    });

    it('should add $deleted to first entry if no query and newDoc are provided', async () => {
      const data = [{ a: 1 }, { b: 2 }, { c: 3 }];

      await this.db.create(data);

      const nUpdated = await this.db.update();

      assert.strictEqual(nUpdated, 1);
      assert.strictEqual(this.db.data.length, 4);
      assert.hasAllKeys(this.db.data[0], ['_id', 'a', '$deleted']);
      assert.hasAllKeys(this.db.data[3], ['_id']);
    });

    it('should add $deleted to first entry matching query with empty object', async () => {
      const data = [{ a: 1 }, { b: 2 }, { c: 3 }];
      const query = { b: 2 };

      await this.db.create(data);

      const nUpdated = await this.db.update(query);

      assert.strictEqual(nUpdated, 1);
      assert.strictEqual(this.db.data.length, 4);
      assert.hasAllKeys(this.db.data[1], ['_id', 'b', '$deleted']);
      assert.hasAllKeys(this.db.data[3], ['_id']);
    });

    it('should replace the first entry matching query with newDoc', async () => {
      const data = [{ a: 1 }, { b: 2 }, { c: 3 }];
      const query = { b: 2 };
      const newDoc = { data: 'mocha' };

      await this.db.create(data);

      const nUpdated = await this.db.update(query, newDoc);

      assert.strictEqual(nUpdated, 1);
      assert.hasAnyKeys(this.db.data[1], newDoc);
      assert.hasAnyKeys(this.db.data[0], data[0]);
    });

    it('should replace all entries if multi is true', async () => {
      const data = [{ a: 1 }, { b: 2 }, { c: 3 }];
      const newDoc = { data: 'mocha' };

      await this.db.create(data);

      const nUpdated = await this.db.update({}, newDoc, { multi: true });

      assert.strictEqual(nUpdated, data.length);
      assert.hasAnyKeys(this.db.data[2], newDoc); // Sample test
    });

    it('should accept modifiers', async () => {
      const data = [{ a: 1 }, { b: 2 }, { c: 3 }];
      const update = { $inc: { c: 3 } };

      await this.db.create(data);

      const nUpdated = await this.db.update({}, update, { multi: true });

      assert.strictEqual(nUpdated, data.length);
      assert.hasAnyKeys(this.db.data[2], { c: 6 }); // Sample test
    });
  });

  describe('delete()', () => {
    it('should throw an error on invalid query', async () => {
      try {
        await this.db.delete(null);
        assert.fail();
      } catch (err) {
        assert.isTrue(true);
      }
    });

    it('should remove the first element on empty query', async () => {
      const data = [{ a: 1 }, { b: 2 }, { c: 3 }];

      await this.db.create(data);

      const nRemoved = await this.db.delete();

      assert.strictEqual(nRemoved, 1);
      assert.hasAnyKeys(this.db.data[0], '$deleted');
    });

    it('should remove the first matching element on query', async () => {
      const data = [{ a: 1 }, { a: 1, b: 2 }, { c: 3 }];

      await this.db.create(data);

      const nRemoved = await this.db.delete({ a: 1 });

      assert.strictEqual(nRemoved, 1);
      assert.hasAnyKeys(this.db.data[0], '$deleted');
    });

    it('should remove no item if query does not match', async () => {
      const data = [{ a: 1 }, { a: 1, b: 2 }, { c: 3 }];

      await this.db.create(data);

      const nRemoved = await this.db.delete({ d: 1 });

      assert.strictEqual(nRemoved, 0);
      assert.hasAnyKeys(this.db.data[0], data[0]);
    });

    it('should remove all items if no query and multi is true', async () => {
      const data = [{ a: 1 }, { a: 1, b: 2 }, { c: 3 }];

      await this.db.create(data);

      const nRemoved = await this.db.delete({}, { multi: true });

      assert.strictEqual(nRemoved, data.length);
      this.db.data.forEach(item => assert.hasAnyKeys(item, '$deleted'));
    });

    it('should remove matching elements if multi is true', async () => {
      const data = [{ a: 1 }, { a: 1, b: 2 }, { c: 3 }];

      await this.db.create(data);

      const nRemoved = await this.db.delete({ a: 1 }, { multi: true });

      assert.strictEqual(nRemoved, 2);
      assert.hasAnyKeys(this.db.data[0], '$deleted');
    });

    it('should remove no items if query does not match and multi is true', async () => {
      const data = [{ a: 1 }, { a: 1, b: 2 }, { c: 3 }];

      await this.db.create(data);

      const nRemoved = await this.db.delete({ d: 1 }, { multi: true });

      assert.strictEqual(nRemoved, 0);
      assert.strictEqual(this.db.data.length, data.length);
    });
  });
});
