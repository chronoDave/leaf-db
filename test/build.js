import esbuild from 'esbuild';
import path from 'path';
import fsp from 'fs/promises';

const outdir = path.join(process.cwd(), 'test/build');

await fsp.rm(outdir, { force: true, recursive: true });
await esbuild.build({
  entryPoints: ['test/unit/**/*.spec.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outdir,
  outbase: 'test/unit'
});
