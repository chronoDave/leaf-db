import fsp from 'fs/promises';
import esbuild from 'rollup-plugin-esbuild';
import dts from 'rollup-plugin-dts';

await fsp.rm('dist', { recursive: true, force: true });

export default [{
  input: 'src/leafdb.ts',
  plugins: [esbuild({ target: 'esnext' })],
  external: [
    'fs',
    'fs/promises',
    'path'
  ],
  output: {
    dir: 'dist',
    format: 'es',
    chunkFileNames: chunk => `${chunk.name}.js`
  }
}, {
  input: 'src/leafdb.ts',
  plugins: [dts()],
  output: {
    file: 'dist/leafdb.d.ts',
    format: 'es'
  }
}, {
  input: 'src/lib/storage.ts',
  plugins: [dts()],
  output: {
    file: 'dist/storage.d.ts',
    format: 'es'
  }
}];
