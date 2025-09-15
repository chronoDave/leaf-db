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
  <img alt="Bundle size" src="https://img.shields.io/bundlejs/size/leaf-db">
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
      - [Number](#number)
        - [`$gt`](#gt)
        - [`$gte`](#gte)
        - [`$lt`](#lt)
        - [`$lte`](#lte)
      - [String](#string)
        - [`$regexp`](#regexp)
      - [Array](#array)
        - [`$length`](#length)
        - [`$includes`](#includes)
      - [Logic](#logic)
        - [`$not`](#not)
        - [`$and`](#and)
        - [`$or`](#or)
- [API](#api)
  - [`id()`](#id)
  - [`docs`](#docs)
  - [`open()`](#open)
  - [`close()`](#close)
  - [`get()`](#get)
  - [`insert()`](#insert)
  - [`query()`](#query)
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
import LeafDB from 'leaf-db';

type Document = {
  title: string
  name: string
}

const db = new LeafDB<Document>({ name: 'db', dir: process.cwd() });

await db.open();

const drafts = [
  { title: 'Lady', name: 'Mipha' },
  { title: 'Young Rito Warrior', name: 'Tulin' }
]
await Promise.all(drafts.map(async draft => db.insert(draft)));

// [{ _id: <string>, title: 'Young Rito Warrior', name: 'Tulin' }]
const characters = db.query({ name: 'Tulin' });

const tulin = characters[0];
tulin.title = 'Rito Warrior';

await db.update(tulin); // Overwrite existing document

await db.close();
```

## Concepts

### Document

Leaf-db stores data as [JSON](https://www.json.org/json-en.html) documents and saves them inside a [JSONL](https://jsonlines.org/) file.

#### Keys

Document keys must be of type `string` and cannot start with `$`.

Every document is required to have an `_id` field. Leaf-db automatically creates an `_id` if the field does not exist on insertion. `_id` is required to be unique when inserting documents.

### Values

Leaf-db only supports JSON values, which is defined as:

```TS
type Json =
  string |
  number |
  boolean |
  null |
  Json[] |
  { [key: string]: Json };
```

### Persistence

Leaf-db stores the database in memory by default. To make use of persistence, simply provide a path in the constructor and open the database.

```TS
import LeafDB from 'leaf-db';

/**
 * Create a new database under process.cwd()
 * This will create `db.jsonl` in process.cwd() 
 */
const db = new LeafDB({ name: 'db', dir: process.cwd() });
await db.open();
```

### Corruption

When opening a database from storage, leaf-db will return any documents that are corrupt. These documents will be deleted once opened.

```TS
import LeafDB from 'leaf-db';

const db = new LeafDB({ name: 'db', dir: process.cwd() });
const corrupt = await db.open(); // Corrupt[]
```

```TS
type Corrupt = {
  raw: string;
  error: Error;
};
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
 * Objects and arrays match on partial matches
 * { eras: [] } // Match
 * { eras: ['era of the wilds'] } // No match
 * { eras: [Sky Era'] } // No Match
 */
const b = { eras: ['Era of the Wilds'] }
```

#### Operators

Operators allow for more complex queries. Operators must always be used in combination with values.

##### Number

###### `$gt`

Is greater than

```TS
const query = { a: { $gt: 3 } };

const a = { a: 2 }; // false
const b = { a: 3 }; // false
const c = { a: 4 }; // true
```

###### `$gte`

Is greater than or equal to

```TS
const query = { a: { $gte: 3 } };

const a = { a: 2 }; // false
const b = { a: 3 }; // true
const c = { a: 4 }; // true
```

###### `$lt`

Is less than

```TS
const query = { a: { $lt: 3 } };

const a = { a: 2 }; // true
const b = { a: 3 }; // false
const c = { a: 4 }; // false
```

###### `$lte`

Is less than or equal to

```TS
const query = { a: { $lte: 3 } };

const a = { a: 2 }; // true
const b = { a: 3 }; // true
const c = { a: 4 }; // false
```

##### String

###### `$regexp`

Matches strings against RegExp

```TS
const query = { a: { $regexp: /\w+/g } }

const a = { a: '' }; // false
const b = { a: '0' }; // false
const c = { a: 'a' }; // true
```

##### Array

###### `$length`

Equal to length

```TS
const query = { a: { $length: 3 } }

const a = { a: [] }; // false
const b = { a: [1, 2, 3] }; // true
const c = { a: [1, 2, 3, 4] }; // false
```

###### `$includes`

Has value in array. Does not partial match on arrays or objects.

```TS
const query = { a: { $includes: 3 } };

const a = { a: [] }; // false
const b = { a: [1, 2, 3] }; // true

const query = { b: { $includes: [3] } };

const a = { b: [ [3] ] }; // true
const b = { b: [ [3, 4] ] }; // false
```

##### Logic

###### `$not`

Invert query

```TS
const query = { $not: { a: { $lt: 3 } } };

const a = { a: 2 }; // false
const b = { a: 4 }; // true
```

###### `$and`

Must match all queries

```TS
const query = { $and: [{ a: 2 }, { b: { $lt: 3 } }] };

const a = { a: 2, b: 2 }; // true
const b = { a: 2, b: 4 }; // false
```

###### `$or`

Matches any query

```TS
const query = { $and: [{ a: 2 }, { b: { $lt: 3 } }] };

const a = { a: 2, b: 2 }; // true
const b = { a: 2, b: 4 }; // true
```

## API

### `id()`

Generate a new, unique id.

```TS
import LeafDB from 'leaf-db';

const id = LeafDB.id();
```

### `docs`

Get all documents

```TS
const docs = db.docs // Doc<T>[]
```

### `open()`

Open persistent storage.

```TS
import LeafDB from 'leaf-db';

const db = new LeafDB({ name: 'db', dir: process.cwd() });

const corrupted = await db.open(); // Corrupt[]
```

### `close()`

Close persistent storage.

```TS
await db.close();
```

### `get()`

Get document by id

```TS
db.get('a'); // { _id: 'a' }
```

### `insert()`

Insert document(s) into the database. Will throw an error if duplicate `_id`'s are found.

```TS
const drafts = [{ name: 'Tulin', }, { name: 'Mipha' }];
// [{ _id: <string>, name: 'Tulin' }, { _id: <string>, name: 'Mipha' }]
const docs = await Promise.all(drafts.map(async draft => draft.insert(draft)));
```

### `query()`

Find document(s) based by [query](#queries).

```TS
// Return docs where `name` is equal to `Mipha`
const docs = db.query({ name: 'Mipha' });
// Return docs where `name` is equal to `Mipha` or where `name` is equal to `Tulin`
const docs = db.query({ $or: [{ name: 'Mipha' }, { name: 'Tulin' }] });
```

### `update()`

Update existing document. Throws if document does not exist

```TS
// Update document `a` with new name `Tulin`
const docs = db.update({ _id: 'a', name: 'Tulin' });
```

### `delete()`

Delete document by `_id`

```TS
// Delete document `a`
await db.delete('a');
```

### `drop()`

Delete all documents in the database.

```TS
await db.drop();
```

## Acknowledgements

- Icon made by [Freepik](https://www.freepik.com) from [www.flaticon.com](https://www.flaticon.com/)
- This project is inspired by [louischatriot/nedb](https://github.com/louischatriot/nedb)
