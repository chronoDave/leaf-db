# NeDB-R (Node Embedded DataBase - Redux)

---

An embedded Node database for JavaScript, based on [Louis Chatriot's NeDB](https://github.com/louischatriot/nedb). Simply writes to a file, append-only.

## API

 - [Create / load database](#create-load-database)
 - [CRUD](#CRUD)
   - [`create()`](#createdoc-docs)
   - [`read()`](#readquery-multi-docs)
     - [Basic query](#basic-query)
     - [Dot notation](#dot-notation)
     - [Operators](#operators)
   - [`update()`](#updatequery-update-multi-n)
     - [Modifiers](#modifiers)
   - [`delete()`](#deletequery-multi-n)

### Create / load database

 - `name` - Database file name (default `db`)
 - `root` - Database rooth path (default `process.cwd()`)
 - `autoload` - Should database be loaded on creation (default `true`)
 - `strict` - Should database throw silent errors (default `false`)

### CRUD

#### `create(doc) => [doc(s)]`

 - `doc` - Object to insert

Inserts doc(s) into the database. `_id` is automatically generated (~16 character string) if the field does not exist.

Fields cannot start with `$` (modifier field) or contain `.` (used for dot-queries). Values cannot be `undefined`.

`create()` will silently fail if doc(s) are invalid and insert those who are valid. If `strict` is enabled, `create()` will reject on the first invalid doc. Doc(s) are only inserted when the entire transaction is successful.

<b>Example</b>

```JS
const doc = {
  crud: 'create',
  data: [{
    field: 1
  }]
}

try {
  const data = await db.create(doc) // Data is always an array
} catch (err) {
  console.error(err)
}
```

#### `read(query, { multi }) => [doc(s)]`

 - `query` - Query object (default `{}`)
 - `multi` - Should match multiple docs (default `false`)

Find doc(s) matching query object. Operators and dot notation are supported and can be mixed together.

##### Basic query

```JS
// Data in database
// { _id: 1, type: 'normal', important: false, variants: ['weak', 'strong'] }
// { _id: 2, type: 'normal', important: true, variants: ['weak', 'strong'] }
// { _id: 3, type: 'strong', important: false, variants: ['weak', 'strong'] }
// { _id: 4, type: 'weak', variants: ['weak'], properties: { type: 'weak', parent: 3 } }

// For this example, the matched docs will be reduced to just their _id

// Find first docs matching type 'normal'
// [1]
await db.read({ type: 'normal' })

// Find all docs matching type 'normal'
// [1, 2, 3]
await db.read({ type: 'normal' }, { multi: true })

// Find all docs matching type 'normal' and important 'true'
// [2], all fields must match
await db.read({ type: 'normal', important: 'true' }, { multi: true } })

// Find all docs with variants 'weak'
// [4], note how only 4 matches, even though all entries contain weak
// When using this query shape, exact matches will be used
await db.read({ variant: ['weak'] }, { multi: true })

// Find all docs with variants 'strong', 'weak'
// [], order is also important
await db.read({ variant: ['strong', 'weak'] }, { multi: true })

// Find all docs with parent '3'
// [], all keys must be present
await db.read({ properties: { parent: 3 } })
// [4], but key order does not matter
await db.read({ properties: { parent: 3, type: 'weak' } })
```

##### Dot notation

Dot notation can be used to match nested fields

```JS
// Data in database
// { _id: 1, variants: ['normal', 'strong'], properties: { type: 'weak', parent: 3 } }
// { _id: 2, variants: ['strong', 'normal'], properties: { type: 'weak', parent: 3 } }
// { _id: 3, variants: [{ id: 'strong', properties: [{ type: 'weak' }] }] }

// For this example, the matched docs will be reduced to just their _id

// Find all docs with properties.type 'weak'
// [1, 2]
await db.read({ 'properties.type': 'weak' }, { multi: true })

// Find all docs where first entry of variants is `strong`
// [2]
await db.read({ 'variants.0': 'strong' }, { multi: true })
// Brackets can be used for arrays as well
await db.read({ 'variants[0]': 'strong' }, { multi: true })

// Find all docs where type of first entry of properties of first entry of variants is 'weak'
// [3]
await db.read({ 'variants.0.properties.0.type': 'weak' })
```

##### Operators

Operators can be used to query beyond simple matches. The following operators are supported:

<b>Logic operators</b>

 - `$gt` - Is greater than
 - `$gte` - Is greater or equal than
 - `$lt` - Is less than
 - `$lte` - Is less or equal than
 - `$ne` - Is not equal

<b>Object operators</b>

 - `$exists` - Does key exist
 - `$some` - Do any values match

<b>Array operators</b>

These operators will throw an error if the pointed field is not an array

 - `$has` - Does array have value


<b>Example</b>

```JS
// Data in database
// { _id: 1, type: 'normal', important: false, variants: ['weak', 'strong'] }
// { _id: 2, type: 'normal', important: true, variants: ['weak', 'strong'] }
// { _id: 3, type: 'strong', important: false, variants: ['weak', 'strong'] }
// { _id: 4, type: 'weak', variants: ['weak'], properties: { type: 'weak', parent: 3, variants: ['strong'] } }
// { _id: 5, properties: [{ variants: ['weak', 'normal' ] }, { type: 'strong' }] }

// For this example, the matched docs will be reduced to just their _id

// $gt / $gte / $lt / $lte
// [3, 4]
await db.read({ $gt: { _id: 2 } }, { multi: true })
// [4], all fields within '$lte' must match
await db.read({ $lte: { _id: 4, 'properties.parent': 3 }})

// $ne
// [2, 3, 4, 5]
await db.read({ $ne: { _id: 3 } }, { multi: true })

// $exists
// [1, 2, 3, 4]
await db.read({ $exists: 'type' }, { multi: true })
// [1, 2, 3]
await db.read({ $exists: ['type', 'important'] }, { multi: true })

// $some
// [2, 5]
await db.read({ $some: { _id: 5 important: true } }, { multi: true })

// $has
// [1, 2, 3, 4]
await db.read({ $has: { variants: 'weak' } }, { multi: true })
// [4]
await db.read({ $has: { 'properties.variants': 'strong' } })
// Error, field is not an array
await db.read({ $has: { type: 'weak' } })
// Error, dot notation isn't a valid object field
await db.read({ $has: { properties: { 'variants.0': 'weak' } } })

```

#### `update(query, update, { multi }) => n`

 - `query` - Query object (default `{}`)
 - `update` - Update object (default `{}`)
 - `multi` - Should match multiple docs (default `false`)

Find doc(s) matching query object. Update supports modifiers, but fields and modifiers cannot be mixed together. Dot notation cannot be used without modifiers.

If no modifiers are provided, `update()` will override the found doc(s) with `update`

`_id` fields cannot be overwritten. If `strict` is enabled, providing an `_id` to `update` will throw an error.

<b>Example</b>

```JS
// Data in database
// { _id: 1, type: 'normal', important: false, variants: ['weak', 'strong'] }
// { _id: 2, type: 'normal', important: true, variants: ['weak', 'strong'] }
// { _id: 3, type: 'strong', important: false, variants: ['weak', 'strong'] }
// { _id: 4, type: 'weak', variants: ['weak'], properties: { type: 'weak', parent: 3, variants: ['strong'] } }

// Set first doc to {}
await db.update()

// Set all docs to {}
await db.update({}, {}, { multi: true })

// Set matching docs to { type: 'strong' }
// { _id: 1, type: 'strong' }
// { _id: 2, type: 'strong' }
// { _id: 3, type: 'strong', important: false, variants: ['weak', 'strong'] }
// { _id: 4, type: 'weak', variants: ['weak'], properties: { type: 'weak', parent: 3, variants: ['strong'] } }
await db.update({ type: 'normal' }, { type: 'strong' }, { multi: true })

// _id fields will not be overwritten
// { _id: 1, type: 'strong' }
// { _id: 2, type: 'strong' }
// { _id: 3, type: 'strong', important: false, variants: ['weak', 'strong'] }
// { _id: 4, type: 'weak', variants: ['weak'], properties: { type: 'weak', parent: 3, variants: ['strong'] } }
await db.update({ type: 'normal' }, { type: 'strong', _id: 1 }, { multi: true })

// Error, dot notation isn't a valid field
await db.update({ type: 'normal' }, { 'properties.type': 'strong', _id: 1 }, { multi: true })
```

##### Modifiers

Modifiers can be used to set specific values

 - `$inc` - Increment value
 - `$set` - Set value

<b>Example</b>

```JS
// Data in database
// { _id: 1 }
// { _id: 2 }
// { _id: 3, count: 3 }

// $inc
// { _id: 1 }
// { _id: 2 }
// { _id: 3, count: 6 }
// Inc will only increment number fields
await db.update({} }, { $inc: { count: 3 } })
// Using '$exists' is safer, however
await db.update({ $exists: 'count' }, { $inc: { count: 3 } })

// $dec
// { _id: 1 }
// { _id: 2 }
// { _id: 3, count: 0 }
// Decrementing can be achieved by incrementing with a negative number
await db.update({ $exists: 'count' }, { $inc: { count: -3 } })

// $set
// { _id: 1 }
// { _id: 2 }
// { _id: 3, count: 'count' }
await db.update({ $exists: 'count' }, { $set: { count: 'count' } })
// { _id: 1, value: 3 }
// { _id: 2, value: 3 }
// { _id: 3, count: 3, value: 3 }
// Keys will be created if it does not exist
await db.update({}, { $set: { value: 3 } })
```

#### `delete(query, { multi }) => n`

 - `query` - Query object (default `{}`)
 - `multi` - Should match multiple docs (default `false`)

Delete doc(s) matching query object.

<b>Example</b>

```JS
// Data in database
// { _id: 1, type: 'normal', important: false, variants: ['weak', 'strong'] }
// { _id: 2, type: 'normal', important: true, variants: ['weak', 'strong'] }
// { _id: 3, type: 'strong', important: false, variants: ['weak', 'strong'] }
// { _id: 4, type: 'weak', variants: ['weak'], properties: { type: 'weak', parent: 3, variants: ['strong'] } }

// Delete all data
await db.delete()

// Delete first match
// [1, 3, 4]
await db.delete({ _id: 2 })

// Delete all matches
// [3, 4]
await db.delete({ type: 'normal' }, { multi: true })
```

## Performance

Run benchmark

```
yarn bench
```

### Speed

Stats from my machine:

```
create()
Total: 614413.380ms
Avg: 6.144ms (100000 samples)

read()
Total: 913577.564ms
Avg: 9.136ms (100000 samples)

update()
Total: 125.113ms

delete()
Total: 153.409ms
```
