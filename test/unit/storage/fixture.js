const path = require('path');

const file = path.resolve(__dirname, 'test.txt');
const { dir, name } = path.parse(file);

module.exports = {
  file,
  root: dir,
  name
};
