/* eslint-disable no-console */
const { performance } = require('perf_hooks');

const LeafDB = require('./build/model').default;

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
 * I don't really care for precision.
 *
 * @param {number} data - Database size (default `100000`)
 * @param {number} samples - Number of actions (default `1000`)
 */
const bench = async (data = 100000, samples = 1000) => {
  try {
    const db = new LeafDB('bench');

    console.log('Starting benchmark: insert()');
    const ts1 = performance.now();
    for (let i = 0; i < data; i += 1) {
      await db.insert({ i, r: Math.random().toFixed(3) });
    }
    const te1 = performance.now();

    console.log('Starting benchmark: find()');
    const ts2 = performance.now();
    for (let i = 0; i < samples; i += 1) {
      await db.find({ r: Math.random().toFixed(3) });
    }
    const te2 = performance.now();

    console.log('Starting benchmark: findById()');
    const ts3 = performance.now();
    for (let i = 0; i < samples; i += 1) {
      await db.findById(Math.random().toFixed(3));
    }
    const te3 = performance.now();

    console.log('Starting benchmark: update()');
    const ts4 = performance.now();
    for (let i = 0; i < samples; i += 1) {
      await db.update({ r: Math.random().toFixed(3) });
    }
    const te4 = performance.now();

    console.log('Starting benchmark: updateById()');
    const ts5 = performance.now();
    for (let i = 0; i < samples; i += 1) {
      await db.updateById(Math.random().toFixed(3));
    }
    const te5 = performance.now();

    console.log('Starting benchmark: delete()');
    const ts6 = performance.now();
    for (let i = 0; i < samples; i += 1) {
      await db.delete({ r: Math.random().toFixed(3) });
    }
    const te6 = performance.now();

    console.log('Starting benchmark: deleteById()');
    const ts7 = performance.now();
    for (let i = 0; i < samples; i += 1) {
      await db.deleteById(Math.random().toFixed(3));
    }
    const te7 = performance.now();

    const t1 = te1 - ts1;
    const t2 = te2 - ts2;
    const t3 = te3 - ts3;
    const t4 = te4 - ts4;
    const t5 = te5 - ts5;
    const t6 = te6 - ts6;
    const t7 = te7 - ts7;

    console.log(`\nDatabase size: ${data}, sample size: ${samples}`);
    console.log(`\ninsert()\nTotal:${t1.toFixed(3)}ms\nAvg: ${(t1 / samples).toFixed(3)}ms`);
    console.log(`\nfind()\nTotal:${t2.toFixed(3)}ms\nAvg: ${(t2 / samples).toFixed(3)}ms`);
    console.log(`\nfindById()\nTotal:${t3.toFixed(3)}ms\nAvg: ${(t3 / samples).toFixed(3)}ms`);
    console.log(`\nupdate()\nTotal:${t4.toFixed(3)}ms\nAvg: ${(t4 / samples).toFixed(3)}ms`);
    console.log(`\nupdateById()\nTotal:${t5.toFixed(3)}ms\nAvg: ${(t5 / samples).toFixed(3)}ms`);
    console.log(`\ndelete()\nTotal:${t6.toFixed(3)}ms\nAvg: ${(t6 / samples).toFixed(3)}ms`);
    console.log(`\ndeleteById()\nTotal:${t7.toFixed(3)}ms\nAvg: ${(t7 / samples).toFixed(3)}ms`);
  } catch (err) {
    console.error(err);
  }
};

bench();
