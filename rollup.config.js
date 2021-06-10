import esbuild from 'rollup-plugin-esbuild';
import dts from 'rollup-plugin-dts';
import commonjs from '@rollup/plugin-commonjs';

const input = 'src/model.ts';
const outputFile = type => `dist/leafdb.${type}`;

export default [{
  external: [
    'fast-deep-equal',
    '@chronocide/dot-obj'
  ],
  input,
  plugins: [
    commonjs(),
    esbuild({
      target: 'esnext'
    })
  ],
  output: [{
    file: outputFile('cjs'),
    exports: 'auto',
    format: 'cjs',
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
