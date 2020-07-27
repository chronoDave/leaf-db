/* eslint-disable no-await-in-loop */
const fse = require('fs-extra');
const { performance } = require('perf_hooks');
const path = require('path');

const Datastore = require('../src/lib/datastore');

const logBench = (ts, te, n) => {
  console.log(`Total: ${(te - ts).toFixed(3)}ms`);
  console.log(`Avg: ${((te - ts) / n).toFixed(3)}ms (${n} samples)`);
};

/**
 * Basic benchmarking
 *
 * Takes the most "expensive" actions and benchmarks those.
 * Using fairly simple data because I don't want the benchmarks
 * to literally take forever.
 *
 * Data created during the create() benchmark is re-used as
 * creating data is time costly.
 *
 * Using only 3 decimal precision and simple average, because
 * I don't really care for precision that much.
 *
 * @param {number} n - Sample size (default `1`)
 */
const bench = async (n = 1) => {
  console.log('Starting benchmark: create()\n');

  try {
    const db = new Datastore({
      root: __dirname,
      name: 'bench',
      autoload: true
    });

    const ts1 = performance.now();
    for (let i = 0; i < n; i += 1) {
      // Generate random samples
      await db.create({ i, r: Math.random().toFixed(3) });
    }
    const te1 = performance.now();
    logBench(ts1, te1, n);

    console.log('\nStarting benchmark: read()\n');

    /**
     * Benching random reads
     */
    const ts2 = performance.now();
    for (let i = 0; i < n; i += 1) {
      await db.read({ r: Math.random().toFixed(3) }, { multi: true });
    }
    const te2 = performance.now();
    logBench(ts2, te2, n);

    console.log('\nStarting benchmark: update()\n');

    /**
     * Only benching the time it takes to find and update `n` fields,
     * otherwise this would take forever
     */
    const ts3 = performance.now();
    await db.update(
      { r: Math.random().toFixed(3) },
      { $inc: { r: 1 } },
      { multi: true }
    );
    const te3 = performance.now();
    console.log(`Total: ${(te3 - ts3).toFixed(3)}ms`);

    /**
     * Only benching the time it takes to find and delete `n` fields,
     * otherwise this would take forever
     */
    console.log('\nStarting benchmark: delete()\n');

    const ts4 = performance.now();
    await db.delete(
      { r: Math.random().toFixed(3) + 1 },
      { multi: true }
    );
    const te4 = performance.now();
    console.log(`Total: ${(te4 - ts4).toFixed(3)}ms`);
  } catch (err) {
    console.log(err);
  }

  // Cleanup
  fse.removeSync(path.resolve(__dirname, 'bench.txt'));
};

bench(100000);
