# NeDB-R (Node Embedded DataBase - Redux)

---

An embedded Node database for JavaScript, based on [Louis Chatriot's NeDB](https://github.com/louischatriot/nedb).

## Another NeDB version, why use this one?

Unlike a fork, NeDB-R was written from the ground up, overhauling the original API and using a more modern approach.

## Such as?

NeDB-R makes the following changes:

- Modern syntax (ES6).
- No callbacks, all CRUD actions are Promise based (async).
- Less external depedencies.
- Dropped support for browser; it's a _node_ embedded database, not JavaScript.
- Dropped `.` query support.
- Dropped upsert support for `update()`.
- Renamed `insert()` and `find()` to `create()` and `read()` respectively (following CRUD naming convention).
- Removed `findOne()`, use `multi` options instead. This makes `read()` and `update()` consistent with each other.

