import esbuild from 'rollup-plugin-esbuild';
import dts from 'rollup-plugin-dts';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';

const input = 'src/model.ts';
const outputFile = type => `dist/leafdb.${type}`;

export default [{
  input,
  plugins: [
    commonjs(),
    nodeResolve({
      resolveOnly: [
        '@chronocide/dot-obj',
        'fast-deep-equal'
      ]
    }),
    esbuild({
      target: 'es2020'
    })
  ],
  output: [{
    file: outputFile('js'),
    exports: 'auto',
    format: 'cjs',
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
