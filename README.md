<div align="center">
  <img src="/assets/icon.svg" width="128" alt="leaf-db">

  <h1>leaf-db</h1>
  <p><b>leaf-db</b> is a simple <a href="https://en.wikipedia.org/wiki/NoSQL">NoSQL</a> embeddable database for <a href="https://nodejs.org/en/">Node.js</a>.</p>
</div>

<div align="center">
  <a href="/LICENSE">
    <img alt="License GPLv3" src="https://img.shields.io/badge/license-GPLv3-blue.svg" />
  </a>
  <a href="https://www.npmjs.com/package/leaf-db">
    <img alt="NPM" src="https://img.shields.io/npm/v/leaf-db?label=npm">
  </a>
  <a href="https://bundlephobia.com/result?p=leaf-db@latest">
    <img alt="Bundle size" src="https://img.shields.io/bundlephobia/minzip/leaf-db@latest.svg">
  </a>
  <a href="https://github.com/chronoDave/leaf-db/actions/workflows/ci.yml">
    <img alt="CI" src="https://github.com/chronoDave/leaf-db/workflows/ci/badge.svg?branch=master">
  </a>
  <a href="https://github.com/chronoDave/leaf-db/actions/workflows/codeql.yml">
     <img alt="CodeQL" src="https://github.com/chronoDave/leaf-db/actions/workflows/codeql.yml/badge.svg?branch=master">
  </a>
</div>

## Features

- **Strong-typed** documents and queries.
- **Easy to embed** as it does not require an HTTP server to run.
- Uses **JSON** documents.

## Table of Contents

- [Getting started](#getting-started)
- [Concepts](#concepts)
  - [Document](#document)
    - [Keys](#keys)
    - [Values](#values)
  - [Persistence](#persistence)
  - [Corruption](#corruption)
  - [Queries](#queries)
    - [Operators](#operators)
- [API](#api)
  - [`id()`](#open)
  - [`open()`](#open)
  - [`close()`](#close)
  - [`insert()`](#insert)
  - [`select()`](#select)
  - [`update()`](#update)
  - [`delete()`](#delete)
  - [`drop()`](#drop)

## Getting Started

### Installation

```sh
npm i leaf-db
```

### Example

Create a database using file storage with strong-typed documents:

```TS
import LeafDB, { Draft } from 'leaf-db';

interface Document extends Draft {
  title: string
  name: string
}

// Use process.cwd() + 'db' as database root
const db = new LeafDB<Document>('db');
db.open();
db.insert([
  { title: 'Lady', name: 'Mipha' },
  { title: 'Young Rito Warrior', name: 'Tulin' }
]);

// [{ _id: <string>, title: 'Lady', name: 'Mipha' }]
const characters = db.select({ title: 'Lady' });
```

## Concepts

### Document

Leaf-db stores data as [JSON](https://www.json.org/json-en.html) documents.

#### Keys

Document keys must be of type `string` and cannot start with `$`.

Every document is required to have an `_id` field. Leaf-db automatically creates an `_id` if the field does not exist on insertion. Keys have the following restrictions:

- `_id` cannot be mutated once created.
- `_id` must be unique.

### Values

Leaf-db only supports JSON values, which are:

- `object`
- `array`
- `string`
- `number`
- `true`
- `false`
- `null`

### Persistence

Leaf-db stores the database in memory by default. To make use of persistence, simply provide a path in the constructor and open the database.

```TS
import LeafDB from 'leaf-db';

/**
 * Create a new database under process.cwd()
 * This will create `db.txt` in process.cwd() 
 */
const db = new LeafDB('db');
db.open();
```

### Corruption

When opening a database from storage, leaf-db will return any documents that are corrupt. These documents will be deleted once opened.

```TS
import LeafDB from 'leaf-db';

const db = new LeafDB('db');
// []
const corrupt = db.open();
```

### Queries

Leaf-db supports both literal values and [operators](#operators). Example:

```TS
/**
 * Literal query where value must equal the query value
 * { name: 'tulin' } // No match
 * { name: 'Mipha' } // No match
 */
const a = { name: 'Tulin' };

/**
 * Objects and arrays must be equal for it to match:
 * { eras: [] } // No match
 * { eras: ['era of the wilds'] } // No match
 * { eras: ['Era of the Wilds', 'Sky Era'] } // No match
 */
const b = { eras: ['Era of the Wilds'] }
```

#### Operators

Operators allow for more complex queries. Operators must always be used in combination with values. For example:

```TS
/**
 * Operator query where values must be greater than number
 */
const a = { age: { $gt: 3 } }
```

<b>Number operators</b>:

- [`$gt`](#gt) - Is greater than
- [`$gte`](#gte) - Is greater or equal than
- [`$lt`](#lt) - Is less than
- [`$lte`](#lte) - Is less or equal than

<b>String operators</b>:

- [`$text`](#text) - Includes string (case insensitive)
- [`$regex`](#regex) - Matches RegExp

<b>Array operators</b>:

- [`$has`](#has) - Has value
- [`$size`](#size) - Equal to size

<b>Logic operators</b>:

- [`$not`](#not) - Does not equal literal

## API

### `id()`

Generate a new, unique id.

```TS
import LeafDB from 'leaf-db';

const id = LeafDB.id();
```

### `open()`

Open persistent storage.

```TS
import LeafDB from 'leaf-db';

const db = new LeafDB('db');

// Draft[]
const corrupted = db.open();
```

### `close()`

Close persistent storage.

```TS
import LeafDB from 'leaf-db';

const db = new LeafDB('db');
db.open();
db.close();
```

### `insert()`

Insert document(s) into the database. Will throw an error if duplicate `_id`'s are found.

```TS
import LeafDB from 'leaf-db';

const db = new LeafDB('db');

// [{ _id: <string>, name: 'Tulin' }, { _id: <string>, name: 'Mipha' }]
const docs = db.insert([{ name: 'Tulin', }, { name: 'Mipha' }]);
```

### `select()`

Find document(s) based on [query](#queries). Multiple queries can be used.

```TS
import LeafDB from 'leaf-db';

const db = new LeafDB('db');

// Return docs where `name` is equal to `Mipha`
const docs = db.select({ name: 'Mipha' });
// Return docs where `name` is equal to `Mipha` or where `name` is equal to `Tulin`
const docs = db.select({ name: 'Mipha' }, { name: 'Tulin' });
```

### `update()`

Update document(s) based on [query](#queries). Multiple queries can be used. Updated document cannot change shape.

```TS
import LeafDB from 'leaf-db';

const db = new LeafDB('db');

// Update docs where `name` is equal to `Tulin` and replace `name` with `Mipha`
const docs = db.update({ name: 'Mipha' }, { name: 'Tulin' });
```

### `delete()`

Delete document(s) based on [query](#queries).

```TS
import LeafDB from 'leaf-db';

const db = new LeafDB('db');

// Delete docs where `name` is equal to `Mipha`
const docs = db.delete({ name: 'Mipha' });
```

### `drop()`

Delete all documents in the database.

```TS
import LeafDB from 'leaf-db';

const db = new LeafDB('db');
db.drop();
```

## Acknowledgements
 
- <div>Icon made by <a href="https://www.freepik.com" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>
- This project is inspired by [louischatriot/nedb](https://github.com/louischatriot/nedb).