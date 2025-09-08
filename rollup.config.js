import fsp from 'fs/promises';
import esbuild from 'rollup-plugin-esbuild';
import dts from 'rollup-plugin-dts';

await fsp.rm('dist', { recursive: true, force: true });

export default [{
  input: 'src/leafdb.ts',
  plugins: [esbuild({ target: 'esnext' })],
  external: [
    'fast-deep-equal',
    'rambda',
    'crypto',
    'fs',
    'path'
  ],
  output: [{
    file: 'dist/leafdb.js',
    format: 'es'
  }]
}, {
  input: 'src/leafdb.ts',
  plugins: [dts()],
  output: {
    file: 'dist/leafdb.d.ts',
    format: 'es'
  }
}];
