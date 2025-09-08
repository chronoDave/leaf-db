const { build } = require('esbuild');
const glob = require('fast-glob');
const fs = require('fs');
const path = require('path');

const outdir = path.resolve(__dirname, 'build');

fs.rmSync(outdir, { force: true, recursive: true });

build({
  entryPoints: glob.sync('unit/**/*.spec.ts', { cwd: __dirname, absolute: true }),
  bundle: true,
  platform: 'node',
  outdir,
  outbase: 'test/unit'
});
