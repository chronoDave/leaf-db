const esbuild = require('rollup-plugin-esbuild').default;
const dts = require('rollup-plugin-dts').default;

const input = 'src/model.ts';
const outputFile = type => `dist/leafdb.${type}`;

module.exports = [{
  external: [
    'fast-deep-equal',
    'rambda',
    'fs',
    'path',
    'crypto'
  ],
  input,
  plugins: [
    esbuild({
      target: 'esnext'
    })
  ],
  output: [{
    file: outputFile('cjs'),
    exports: 'auto',
    format: 'cjs'
  }, {
    file: outputFile('mjs'),
    exports: 'auto',
    format: 'es'
  }]
}, {
  input,
  plugins: [dts()],
  output: {
    file: outputFile('d.ts'),
    format: 'es'
  },
  external: ['fs']
}];
