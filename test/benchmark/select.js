const benchmark = require('./bench');
const LeafDB = require('../..');
const data = require('../assets/nasa_earth-meteorite-landings');

const db = new LeafDB();
db.insert(data);

benchmark('select', () => db.select({ nametype: 'Valid' }));
