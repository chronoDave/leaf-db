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

const measure = (label: string) =>
  async <T>(fn: () => Promise<T>) => {
    console.time(label);
    await fn();
    console.timeEnd(label);
  };

await Promise.all([
  measure('esbuild')(async () => esbuild.build({
    entryPoints: ['src/leafdb.ts'],
    outdir: 'dist',
    platform: 'node',
    bundle: true,
    format: 'esm'
  })),
  measure('dts-bundle-generator')(async () => run('dts-bundle-generator -o dist/leafdb.d.ts src/leafdb.ts --export-referenced-types=false --no-banner=true --no-check=true'))
]);
