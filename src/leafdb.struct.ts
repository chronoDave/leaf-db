import type { StorageOptions } from './lib/storage.ts';
import type { Draft } from './leafdb.ts';

import fsp from 'fs/promises';
import path from 'path';

import LeafDB from './leafdb.ts';

export type Options = {
  entries?: unknown[];
};

export default async <T extends Draft = {}>(entries: unknown[]) => {
  const options: StorageOptions = { name: 'test', dir: import.meta.dirname };
  const db = new LeafDB<T>(options);
  const file = path.format({ ...options, ext: '.ndjson' });
  const raw = entries
    .map(x => JSON.stringify(x))
    .join('\n');

  await fsp.writeFile(file, raw);

  return {
    db,
    file,
    cleanup: async () => fsp.rm(file)
  };
};

export const invalid = [
  1,
  null,
  true,
  '',
  [],
  false,
  { valid: false },
  'valid'
];
