export const production = {
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

export const query = [
  1,
  null,
  undefined,
  true,
  '',
  () => null,
  false
];

export const simple = {
  _id: '1',
  a: 1,
  b: 'string',
  c: null,
  d: false
};

export const nested = {
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

export const complex = {
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

export const update = [
  { _id: 'INVALID' },
  { a: { $set: { b: 3 } } },
  { a: '3', $set: { b: '4' } },
  { $set: { _id: 4 } },
  { $set: { a: { b: { c: [{ _id: 3 }] } } } },
  { $push: [{ a: { $set: true } }] }
];
