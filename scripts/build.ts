import esbuild from 'esbuild';
import { exec } from 'node:child_process';

const run = async (cmd: string) =>
  new Promise<void>((resolve, reject) => exec(cmd, err => {
    if (err) {
      reject(err);
    } else {
      resolve();
    }
  }));

await Promise.all([
  esbuild.build({
    entryPoints: ['src/leafdb.ts'],
    outdir: 'dist',
    bundle: true,
    format: 'esm'
  }),
  esbuild.build({
    entryPoints: ['src/lib/storage.ts'],
    outdir: 'dist',
    bundle: true,
    platform: 'node',
    format: 'esm'
  }),
  run('dts-bundle-generator -o dist/leafdb.d.ts src/leafdb.ts --export-referenced-types=false --no-banner=true --no-check=true'),
  run('dts-bundle-generator -o dist/storage.d.ts src/lib/storage.ts --export-referenced-types=false --no-banner=true --no-check=true')
]);
