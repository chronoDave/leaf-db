const fs = require('fs');
const path = require('path');

const LeafDB = require('../build/model').default;

const invalidQuery = [
  1,
  null,
  undefined,
  true,
  '',
  () => null,
  false
];

const invalidQueryLoose = [
  1,
  null,
  true,
  '',
  () => null
];

const invalidUpdate = [
  { _id: 'INVALID' },
  { a: { $set: { b: 3 } } },
  { a: '3', $set: { b: '4' } },
  { $set: { _id: 4 } },
  { $set: { a: { b: { c: [{ _id: 3 }] } } } },
  { $push: [{ a: { $set: true } }] }
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
  key_5: { _id: 'key_5', data: { label: 'test', values: [{ label: 'test' }] } }
};

const mockObjectSimple = {
  _id: '1',
  a: 1,
  b: 'string',
  c: null,
  d: false
};

const mockObjectNested = {
  _id: '1',
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
  _id: '1',
  a: 1,
  b: [2, null, 3],
  c: [
    {
      d: 'String',
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
    ]
  }
};

/**
 * @param {object} options
 * @param {object?} options.data
 * @param {string?} options.root
 * @param {boolean?} options.strict
 * @param {object?} options.memory
 */
const setup = options => {
  let file = null;
  const name = 'test';

  if (options?.root) {
    file = path.resolve(options.root, `${name}.txt`);
    fs.writeFileSync(file, options?.data ? options.data.map(JSON.stringify).join('\n') : '');
  }

  const db = new LeafDB({
    name,
    root: options?.root ?? null,
    strict: options?.strict ?? null
  });

  if (options?.memory) {
    db._memory._docs = new Map();
    Object.values(options.memory).map(value => db._memory._docs.set(value._id, value));
  }

  return ({ name, file, db });
};

module.exports = {
  setup,
  invalidQuery,
  invalidQueryLoose,
  invalidUpdate,
  invalidPersistent,
  invalidData,
  invalidNumberOperator,
  mockMemory,
  mockObjectSimple,
  mockObjectNested,
  mockObjectComplex,
  mockObjectProduction
};
