const fs = require('fs');
const path = require('path');

const LeafDB = require('../dist/model').default;

const invalidQuery = [
  1,
  null,
  undefined,
  true,
  '',
  () => null,
  false,
  { valid: false }
];

const invalidQueryLoose = [
  1,
  null,
  true,
  '',
  () => null
];

const invalidPersistent = [
  1,
  null,
  true,
  '',
  [],
  false,
  { valid: false },
  'valid'
];

const invalidData = [
  1,
  null,
  undefined,
  true,
  '',
  () => null,
  false,
  'valid'
];

const invalidNumberOperator = [
  '1',
  NaN,
  null,
  undefined,
  true,
  () => 1,
  false,
  [1],
  {}
];

const mockMemory = {
  key_1: { _id: 'key_1', data: 'test', values: [1, 2, 3] },
  key_2: { _id: 'key_2', data: 'not_test', values: [4, 5, 6] },
  key_3: { _id: 'key_3', values: [4, 5, 6] },
  key_4: { _id: 'key_4', data: { values: [1, 2, 3] } },
  key_5: { _id: 'key_5', data: { label: 'test', values: [{ label: 'test' }] } },
  key_6: { _id: 'key_6', data: 'test', $deleted: true }
};

const mockObjectSimple = {
  _id: 1,
  a: 1,
  b: 'string',
  c: null,
  d: false
};

const mockObjectNested = {
  _id: 1,
  a: 1,
  b: {
    c: 'string'
  },
  d: {
    f: {
      g: true,
      h: {
        i: null
      }
    },
    j: 2
  }
};

const mockObjectComplex = {
  _id: 1,
  a: 1,
  b: [2, null, 3],
  c: [
    {
      d: 'string',
      e: {
        f: null
      }
    },
    {
      g: true,
      h: 'string',
      i: {
        j: [4, null]
      }
    }
  ]
};

const mockObjectProduction = {
  file: 'D:\\debug\\[bracket]\\123\\da-sh\\under_score.mp3',
  format: {
    tagTypes: [],
    lossless: false,
    container: 'MPEG',
    codec: 'MPEG 1 Layer 3',
    sampleRate: 44100,
    tool: 'LAME3.98r',
    duration: 171.04979591836735
  },
  metadata: {
    titlelocalized: null,
    cdid: [null],
    date: '2012-08-31T16:09:24',
    title: '"Yours Truly" Setting Type Seven-Star Goku Uniform',
    copyright: 'Creative Commons Attribution: http://creativecommons.org/licenses/by/3.0/',
    comment: [
      'URL: http://freemusicarchive.org/music/Tours/Enthusiast/Tours_-_Enthusiast\r\nComments: http://freemusicarchive.org/\r\nCurator: \r\nCopyright: Creative Commons Attribution: http://creativecommons.org/licenses/by/3.0/'
    ],
  }
};

const setup = ({
  data = null,
  root = null,
  strict = false,
  memory = null,
  autoload = true
} = {}) => {
  let file = null;
  const name = 'test';

  if (root) file = path.resolve(root, `${name}.txt`);
  if (data && file) fs.writeFileSync(file, data.map(JSON.stringify).join('\n'));

  const db = new LeafDB(name, { root, strict, autoload });

  if (memory) db.data = { ...memory };

  return ({ name, file, db });
};

module.exports = {
  setup,
  invalidQuery,
  invalidQueryLoose,
  invalidPersistent,
  invalidData,
  invalidNumberOperator,
  mockMemory,
  mockObjectSimple,
  mockObjectNested,
  mockObjectComplex,
  mockObjectProduction
};
