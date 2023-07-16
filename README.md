<div align="center">
  <img src="/assets/icon.svg" width="128" alt="leaf-db">

  <h1>leaf-db</h1>
  <p><b>leaf-db</b> is a modern, promise-based, strongly-typed, embeddable database for <a href="https://nodejs.org/en/">node.js</a>.</p>
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

## Install

```
$ npm i leaf-db
```

## Getting Started

```TS
import LeafDB, { Draft } from 'leaf-db';

interface Document extends Draft {
  species: string,
  name: string | null
}

const db = new LeafDB<Document>();
const pets = db.insert([
  { species: 'cat', name: 'whiskers' },
  { species: 'bird', name: 'tulin' }
]);
```

## API

- [Database](#database)
  - [Create / load](#create-load)
  - [Corruption](#corruption)
- [Document](#document)
  - [Field names](#field-names)
  - [Field values](#field-values)
- [Inserting docs](#inserting-docs)
- [Finding docs](#finding-docs)
  - [Basic query](#basic-query)
  - [Operators](#operators)
  - [Indexing](#indexing)
- [Updating docs](#updating-docs)
  - [Modifiers](#modifiers)
- [Deleting docs](#deleting-docs)
- [Dropping database](#drop)

## Database

### Create / load

`const db = new LeafDB(options)`

 - `options.storage` (string). Storage file path. Must be absolute.
 - `options.storage.root` (string). Storage file path. Must be absolute.
 - `options.storage.name` (default: `leaf-db`). Storage file name.
 - `options.strict` (default: `false`). If true, throws instead of ignores errors

```JS
// Memory-only database
const db = new LeafDB()

// Strict database
const db = new LeafDB({ strict: true })

// Persistent database
const db = new LeafDB({ storage: process.cwd() })
const db = new LeafDB({ storage: { root: process.cwd(), name: 'db' } })

const data = db.open();

db.close()
```

### Corruption

Calling `open()` will return an array of corrupted raw data (string).

## Document

Leaf-DB stores data as [JSON](https://en.wikipedia.org/wiki/JSON) objects.

```JSON
{
  "name": "Titan",
  "age": 4,
  "colour": "chocolate",
  "loved": true,
  "activies": ["walking", "fetch"]
}
```

### Field Names

Field names must be strings and have the following restrictions:

- The field name `_id` is the primary key of a document and cannot be mutated once created. It must be unique and be of type `string`.
- Field names **cannot** start with the dollar sign (`$`) character.

### Field Values

Leaf-DB only supports field values supported by the JSON spec:

 - `number`
 - `string`
 - `boolean`
 - `Array`
 - `Object`
 - `null`

## Inserting docs

`db.insert(Draft[]) => Doc[]`

Inserts drafts into the database. `_id` is automatically generated if the _id does not exist.

Fields cannot start with `$` (modifier field). Values cannot be `undefined`.

`insert()` will reject on the first invalid draft if `strict` is enabled, otherwise invalid drafts are ignored.

`leaf-db` does not keep track of when drafts are inserted, updated or deleted.

<b>Example</b>

```JS
const draft = {
  crud: 'create',
  data: [{
    field: 1
  }]
}

const doc = db.insert([draft]);
```

## Finding docs

### Basic query

`await db.findOne(...Query[]) => Promise<Doc>`
`await db.find(...Query[]) => Promise<Doc[]>`

Find doc(s) matching query. Operators are supported and can be mixed together with object properties.

```JS
// Data
// { _id: '1', type: 'normal', important: false, variants: ['weak', 'strong'] }
// { _id: '2', type: 'normal', important: true, variants: ['weak', 'strong'] }
// { _id: '3', type: 'strong', important: false, variants: ['weak', 'strong'] }
// { _id: '4', type: 'weak', variants: ['weak'], properties: { type: 'weak', parent: 3 } }

// Find docs by _id
// [1]
await db.find({ _id: '1' });

// Find docs matching type 'normal'
// [1, 2, 3] (Doc _id's)
await db.find({ type: 'normal' })

// Find docs matching type 'normal' and important 'true'
// [2], all fields must match
await db.find({ type: 'normal', important: 'true' })

// Find docs with variants 'weak'
// [4], note how only 4 matches, even though all entries contain weak
// Array content and order must mach
await db.find({ variant: ['weak'] })

// Find docs with variants 'strong', 'weak', in that order
// []
await db.find({ variant: ['strong', 'weak'] })

// Find docs with parent '3'
// [], all keys must be present
await db.find({ properties: { parent: '3' } })
// [4], key order does not matter
await db.find({ properties: { parent: '3', type: 'weak' } })

// Find docs that either have parent '4' or important 'false'
// [1, 3]
await db.find({ properties: { parent: '4' } }, { important: false });
```

### Operators

Operators can be used to create advanced queries. The following operators are supported:

<b>Logic operators</b>

 - `$gt` - Is greater than
 - `$gte` - Is greater or equal than
 - `$lt` - Is less than
 - `$lte` - Is less or equal than
 - `$not` - Is not equal

<b>String operators</b>

 - `$text` - Does string include string (case insensitive)
 - `$regex` - Does string match RegExp

<b>Array operators</b>

 - `$has` - Does array contain value

<b>Example</b>

```JS
// Data
// { _id: '1', type: 'normal', important: false, variants: ['weak', 'strong'] }
// { _id: '2', type: 'normal', important: true, variants: ['weak', 'strong'] }
// { _id: '3', type: 'strong', important: false, variants: ['weak', 'strong'] }
// { _id: '4', type: 'weak', variants: ['weak'], properties: { type: 'weak', parent: 3, variants: ['strong'] } }
// { _id: '5', properties: [{ variants: ['weak', 'normal' ] }, { type: 'strong' }] }

// $gt / $gte / $lt / $lte
// [4]
await db.find({ properties: { parent: { $gt: 2 } } })
// [], all fields must match
await db.find({ _id: '1', properties: { parent: { $gt: 2 } } })

// $not
// [2, 3, 4, 5]
await db.find({ _id: { $not: '1' } })

// $text
// [1, 2]
await db.find({ type: { $text: 'mal' } })
// [1, 2]
await db.find({ type: { $text: 'MAL' } })

// $regex
// []
await db.find({ type: { $regex: /MAL/ } })

// $has
// [1, 2, 3, 4]
await db.find({ variants: { $includes: 'weak' } })
// [0] field is not an array
await db.find({ type: { $includes: 'weak' } })
```

## Updating docs

`await db.updateOne(string | Query, Update | NewDoc) => Promise<Doc>`
`await db.update(string[] | Query, Update | NewDoc) => Promise<Doc[]>`

Find doc(s) matching query object. `update()` supports modifiers, but fields and modifiers cannot be mixed together. `update` cannot create invalid field names, such as fields containing dots or fields starting with `$`. Returns the updated docs.

If no modifiers are provided, `update()` will override the found doc(s) with `update`

`_id` fields cannot be overwritten. Trying to do so will throw an error.

<b>Example</b>

```JS
// Data
// { _id: '1', type: 'normal', important: false, variants: ['weak', 'strong'] }
// { _id: '2', type: 'normal', important: true, variants: ['weak', 'strong'] }
// { _id: '3', type: 'strong', important: false, variants: ['weak', 'strong'] }
// { _id: '4', type: 'weak', variants: ['weak'], properties: { type: 'weak', parent: 3, variants: ['strong'] } }

// Set all docs to {}
await db.update()

// Set matching docs to { type: 'strong' }
// { _id: '1', type: 'strong' }
// { _id: '2', type: 'strong' }
// { _id: '3', type: 'strong', important: false, variants: ['weak', 'strong'] }
// { _id: '4', type: 'weak', variants: ['weak'], properties: { type: 'weak', parent: 3, variants: ['strong'] } }
await db.update({ type: 'normal' }, { type: 'strong' })

// _id fields will not be overwritten
// { _id: '1', type: 'strong' }
// { _id: '2', type: 'strong' }
// { _id: '3', type: 'strong', important: false, variants: ['weak', 'strong'] }
// { _id: '4', type: 'weak', variants: ['weak'], properties: { type: 'weak', parent: 3, variants: ['strong'] } }
await db.update({ type: 'normal' }, { type: 'strong', _id: '1' })
```

### Modifiers

Modifiers can be used to set specific values

 - `$add` - Add value (number)
 - `$push` - Add value (array)
 - `$set` - Set value

<b>Example</b>

```JS
// Data
// { _id: '1', count: 0 }
// { _id: '2', count: 0 }
// { _id: '3', count: 3 }

// $add
// { _id: '3', count: 9 }
await db.update({} }, { $add: { count: 3 } })
// { _id: '3', count: 3 }
await db.update({}, { $add: { count: -3 } })

// $push
// { _id: '3', fruits: ['banana'] }
await db.update({} }, { $push: { fruits: 'orange' } })
// { _id: '3' , fruits: ['banana', 'orange'] }

// $set
// { _id: '3', count: 'count' }
await db.update({ count: 0 }, { $set: { count: 'count' } })
// { _id: '1', value: 3, count: 'count' }
// { _id: '2', value: 3, count: 'count' }
// Keys will be created if it does not exist
await db.update({}, { $set: { value: 3 } })
```

## Deleting docs

`await db.deleteOne(string | Query) => Promise<boolean>`
`await db.delete(string[] | Query) => Promise<number>`

Delete doc(s) matching query object.

<b>Example</b>

```JS
// Data in database
// { _id: '1', type: 'normal', important: false, variants: ['weak', 'strong'] }
// { _id: '2', type: 'normal', important: true, variants: ['weak', 'strong'] }
// { _id: '3', type: 'strong', important: false, variants: ['weak', 'strong'] }
// { _id: '4', type: 'weak', variants: ['weak'], properties: { type: 'weak', parent: 3, variants: ['strong'] } }

// Delete all data
// []
await db.delete()

// Delete first match
// [1, 3, 4]
await db.delete({ _id: '2' })

// Delete all matches
// [3, 4]
await db.delete({ type: 'normal' })
```

### Drop

`drop() => void`

Clears both memory and database file.

## Donating

[![ko-fi](https://www.ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/Y8Y41E23T)

## Acknowledgements
 
 - This project is heavily inspired by [louischatriot/nedb](https://github.com/louischatriot/nedb).
 - <div>Icon made by <a href="https://www.freepik.com" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>
