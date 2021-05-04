import esbuild from 'rollup-plugin-esbuild';
import dts from 'rollup-plugin-dts';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import { nodeResolve } from '@rollup/plugin-node-resolve';

import { name } from './package.json';

const input = 'src/model.ts';
const outputFile = type => `dist/${name}.${type}`;

export default [{
  input,
  plugins: [
    commonjs(),
    nodeResolve({
      resolveOnly: [
        'lodash.get',
        'lodash.set',
        'fast-deep-equal'
      ]
    }),
    esbuild({
      target: 'esnext'
    }),
    terser()
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
