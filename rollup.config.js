import esbuild from 'rollup-plugin-esbuild';
import dts from 'rollup-plugin-dts';

const input = 'src/model.ts';
const outputFile = type => `dist/leafdb.${type}`;

export default [{
  external: [
    'fast-deep-equal',
    '@chronocide/dot-obj',
    'immer',
    'rlr',
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
