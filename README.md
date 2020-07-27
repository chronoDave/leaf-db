# NeDB-R (Node Embedded DataBase - Redux)

---

An embedded Node database for JavaScript, based on [Louis Chatriot's NeDB](https://github.com/louischatriot/nedb).

## Another NeDB version, why use this one?

Unlike a fork, NeDB-R was written from the ground up, overhauling the original API and using a more modern approach.

## Such as?

NeDB-R makes the following changes:

- Modern syntax (ES6).
- No callbacks, all CRUD actions are Promise based (async).
- Removed `Executor`, because actions are async.
- Less external depedencies.
- Dropped support for browser; it's a _node_ embedded database, not JavaScript.
- Dropped `.` query support.
- Dropped upsert support for `update()`.
- Renamed `insert()` and `find()` to `create()` and `read()` respectively (following CRUD naming convention).
- Removed `findOne()`, use `multi` options instead. This makes `read()` and `update()` consistent with each other.

## Performance

Run benchmark

```
yarn bench
```

### Speed

Stats from my machine:

```
$ node test/benchmark.js
Starting benchmark: create()

Total: 548129.061ms
Avg: 5.481ms (100000 samples)

Starting benchmark: read()

Total: 355947.256ms
Avg: 3.559ms (100000 samples)

Starting benchmark: update()

Total: 112.260ms

Starting benchmark: delete()

Total: 110.605ms
Done in 904.64s.
```
