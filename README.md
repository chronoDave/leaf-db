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

**JS**

```JS
import LeafDB from 'leaf-db';

const db = new LeafDB();

db.insertOne({ species: 'cat', name: 'whiskers' })
  .then(inserted => console.log(`added ${inserted.name} to the database!`))
  .catch(console.error)
```

**TS**

```TS
import LeafDB from 'leaf-db';

interface Document {
  species: string,
  name: string | null
}

const db = new LeafDB<Document>();
db.insertOne({ species: 'cat', name: 'whiskers' })
  .then(inserted => console.log(`added ${inserted.name} to the database!`))
  .catch(console.error)
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
  - [Dot notation](#dot-notation)
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

// Loading is not neccesary, but recommended
// Not loading means the data from file isn't read,
db.open()

// Closing database
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

- The field name `_id` is the primary key of a document and cannot be mutated once created. It must be unique and be of type `String`.
- Field names **cannot** start with the dollar sign (`$`) character.
- Field names **cannot** contain a dot (`.`) character.

### Field Values

Leaf-DB only supports field values supported by the JSON spec, which includes:

 - `Number`
 - `String`
 - `Boolean`
 - `Array`
 - `Object`
 - `null`

## Inserting docs

`await db.insertOne(NewDoc) => Promise<Doc>`
`await db.insert(NewDoc[]) => Promise<Doc[]>`

Inserts doc(s) into the database. `_id` is automatically generated if the _id does not exist.

Fields cannot start with `$` (modifier field) or contain `.` (dot-queries). Values cannot be `undefined`.

`insert()` will reject on the first invalid doc if `strict` is enabled, otherwise invalid docs are ignored.

`leaf-db` does not keep track of when docs are inserted, updated or deleted.

<b>Example</b>

```JS
const newDoc = {
  crud: 'create',
  data: [{
    field: 1
  }]
}

try {
  const doc = await db.insertOne(newDoc) // newDoc
} catch (err) {
  console.error(err)
}
```

## Finding docs

### Basic query

`await db.findOne(string | Query) => Promise<Doc>`
`await db.find(string[] | Query) => Promise<Doc[]>`

Find doc(s) matching query. Operators and dot notation are supported and can be mixed together.

```JS
// Data
// { _id: 1, type: 'normal', important: false, variants: ['weak', 'strong'] }
// { _id: 2, type: 'normal', important: true, variants: ['weak', 'strong'] }
// { _id: 3, type: 'strong', important: false, variants: ['weak', 'strong'] }
// { _id: 4, type: 'weak', variants: ['weak'], properties: { type: 'weak', parent: 3 } }

// Find docs matching type 'normal'
// [1, 2, 3] (Doc _id's)
await db.find({ type: 'normal' })

// Find all docs matching type 'normal' and important 'true'
// [2], all fields must match
await db.find({ type: 'normal', important: 'true' })

// Find all docs with variants 'weak'
// [4], note how only 4 matches, even though all entries contain weak
// Array content and order must mach
await db.find({ variant: ['weak'] })

// Find all docs with variants 'strong', 'weak', in that order
// []
await db.find({ variant: ['strong', 'weak'] })

// Find all docs with parent '3'
// [], all keys must be present
await db.find({ properties: { parent: 3 } })
// [4], key order does not matter
await db.find({ properties: { parent: 3, type: 'weak' } })
```

### Dot notation

Dot notation can be used to match nested fields

```JS
// Data
// { _id: 1, variants: ['normal', 'strong'], properties: { type: 'weak', parent: 3 } }
// { _id: 2, variants: ['strong', 'normal'], properties: { type: 'weak', parent: 3 } }
// { _id: 3, variants: [{ id: 'strong', properties: [{ type: 'weak' }] }] }

// Find all docs with properties.type 'weak'
// [1, 2]
await db.find({ 'properties.type': 'weak' })

// Find all docs where first entry of variants is `strong`
// [2]
await db.find({ 'variants.0': 'strong' })

// Find all docs where type of first entry of properties of first entry of variants is 'weak'
// [3]
await db.find({ 'variants.0.properties.0.type': 'weak' })
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

 - `$string` - Does string include string
 - `$stringStrict` - Does string include string, case sensitive

<b>Object operators</b>

 - `$keys` - Does object have keys

<b>Array operators</b>

These operators will return false if the queries field is not an array

 - `$includes` - Does array contain value
 - `$or` - Do any of the queries match

<b>Example</b>

```JS
// Data
// { _id: 1, type: 'normal', important: false, variants: ['weak', 'strong'] }
// { _id: 2, type: 'normal', important: true, variants: ['weak', 'strong'] }
// { _id: 3, type: 'strong', important: false, variants: ['weak', 'strong'] }
// { _id: 4, type: 'weak', variants: ['weak'], properties: { type: 'weak', parent: 3, variants: ['strong'] } }
// { _id: 5, properties: [{ variants: ['weak', 'normal' ] }, { type: 'strong' }] }

// $gt / $gte / $lt / $lte
// [3, 4]
await db.find({ $gt: { _id: 2 } })
// [4], all fields within '$lte' must match
await db.find({ $lte: { _id: 4, 'properties.parent': 3 }})

// $not
// [2, 3, 4, 5]
await db.find({ $not: { _id: 1 } })

// $string
// [1, 2]
await db.find({ $string: { type: 'mal' } })
// []
await db.find({ $string: { type: 'MAL' } })
// [1, 2]
await db.find({ $stringStrict: { type: 'MAL' } })

// $keys
// [1, 2, 3, 4]
await db.find({ $keys: ['type'] })
// [1, 2, 3]
await db.find({ $keys: ['type', 'important'] })

// $includes
// [1, 2, 3, 4]
await db.find({ $includes: { variants: 'weak' } })
// [4]
await db.find({ $includes: { 'properties.variants': 'strong' } })
// Error, field is not an array
await db.find({ $includes: { type: 'weak' } })
// Error, dot notation isn't a valid object field
await db.find({ $includes: { properties: { 'variants.0': 'weak' } } })

// $or
// [1, 2, 4]
await db.find({ $or: [{ type: 'weak' }, { type: 'normal' }] })
// [1, 2, 3, 4, 5]
await db.find({ $or: [{ $includes: { variants: 'weak' } }, { _id: 5 }] })
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
// { _id: 1, type: 'normal', important: false, variants: ['weak', 'strong'] }
// { _id: 2, type: 'normal', important: true, variants: ['weak', 'strong'] }
// { _id: 3, type: 'strong', important: false, variants: ['weak', 'strong'] }
// { _id: 4, type: 'weak', variants: ['weak'], properties: { type: 'weak', parent: 3, variants: ['strong'] } }

// Set all docs to {}
await db.update()

// Set matching docs to { type: 'strong' }
// { _id: 1, type: 'strong' }
// { _id: 2, type: 'strong' }
// { _id: 3, type: 'strong', important: false, variants: ['weak', 'strong'] }
// { _id: 4, type: 'weak', variants: ['weak'], properties: { type: 'weak', parent: 3, variants: ['strong'] } }
await db.update({ type: 'normal' }, { type: 'strong' })

// _id fields will not be overwritten
// { _id: 1, type: 'strong' }
// { _id: 2, type: 'strong' }
// { _id: 3, type: 'strong', important: false, variants: ['weak', 'strong'] }
// { _id: 4, type: 'weak', variants: ['weak'], properties: { type: 'weak', parent: 3, variants: ['strong'] } }
await db.update({ type: 'normal' }, { type: 'strong', _id: 1 })

// Error, dot notation isn't a valid field
await db.update({ type: 'normal' }, { 'properties.type': 'strong', _id: 1 })
```

### Modifiers

Modifiers can be used to set specific values

 - `$add` - Add value (number)
 - `$push` - Add value (array)
 - `$set` - Set value

<b>Example</b>

```JS
// Data
// { _id: 1 }
// { _id: 2 }
// { _id: 3, count: 3 }

// $add
// { _id: 3, count: 9 }
await db.update({} }, { $add: { count: 3 } })
// { _id: 3, count: 3 }
await db.update({}, { $add: { count: -3 } })

// $push
// { _id: 3, fruits: ['banana'] }
await db.update({} }, { $push: { fruits: 'orange' } })
// { _id: 3 , fruits: ['banana', 'orange'] }

// $set
// { _id: 3, count: 'count' }
await db.update({ $keys: ['count'] }, { $set: { count: 'count' } })
// { _id: 1, value: 3 }
// { _id: 2, value: 3 }
// { _id: 3, count: 'count', value: 3 }
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
// { _id: 1, type: 'normal', important: false, variants: ['weak', 'strong'] }
// { _id: 2, type: 'normal', important: true, variants: ['weak', 'strong'] }
// { _id: 3, type: 'strong', important: false, variants: ['weak', 'strong'] }
// { _id: 4, type: 'weak', variants: ['weak'], properties: { type: 'weak', parent: 3, variants: ['strong'] } }

// Delete all data
// []
await db.delete()

// Delete first match
// [1, 3, 4]
await db.delete({ _id: 2 })

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
