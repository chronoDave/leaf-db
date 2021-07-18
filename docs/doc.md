# Leaf-DB Documents

## Overview

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

## Field Names

Field names must be strings and have the following restrictions:

- The field name `_id` is the primary key of a document and cannot be mutated once created. Its value must be a string and unique.
- Top-level field names **cannot** start with the dollar sign (`$`) character.
- Top-level fields names **cannot** contain a dot (`.`) character.

## Field Values

Leaf-DB only supports field values supported by the JSON spec, which includes:

 - Number
 - String
 - Boolean
 - Array
 - Object
 - `null`

Values which are `undefined` _can_ be created but will not be stored.
