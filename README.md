# NeDB-R (Node Embedded DataBase - Redux)

---

An embedded Node database for JavaScript, based on [Louis Chatriot's NeDB](https://github.com/louischatriot/nedb).

## Another NeDB version, why use this one?

Unlike a fork, NeDB-R was written from the ground up, overhauling the original API and using a more modern approach.

## Such as?

NeDB-R makes the following changes:

- Modern syntax (ES6).
- No callbacks, all CRUD actions return Promises.
- Smaller bundle size.
- Dropped support for browser; it's a _node_ embedded database.
- Dropped upsert support for `update()`.
- Renamed `insert()` and `find()` to `create()` and `read()` respectively (following CRUD naming convention).
- Removed `findOne()`, use `multi` options instead. This makes `read()` and `update()` consistent with each other.
- Simplified API

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
