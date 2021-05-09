const { Suite } = require('benchmark');

const LeafDB = require('./build/model').default;

const suite = new Suite();
const db = new LeafDB('bench');

console.group('\nBenchmark');
suite
  .add('insert()', async () => {
    await db.insert({ r: Math.random().toFixed(3) });
  })
  .add('find()', async () => {
    await db.find({ r: Math.random().toFixed(3) });
  })
  .add('update()', async () => {
    await db.update({ r: Math.random().toFixed(3) });
  })
  .add('delete()', async () => {
    await db.delete({ r: Math.random().toFixed(3) });
  })
  .on('cycle', event => console.log(String(event.target)))
  .run();
