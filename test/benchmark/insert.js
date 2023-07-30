const benchmark = require('./bench');
const LeafDB = require('../..');
const data = require('../assets/nasa_earth-meteorite-landings');

benchmark('insert', () => {
  const db = new LeafDB();
  db.insert(data);
});
