import type { StorageOptions } from './storage.ts';

import path from 'path';
import fsp from 'fs/promises';

import Storage from './storage.ts';

export default async (x?: string) => {
  const options: StorageOptions = { dir: import.meta.dirname, name: 'test' };
  const file = path.format({ ...options, ext: '.jsonl' });

  if (typeof x === 'string') await fsp.writeFile(file, x);

  return {
    storage: new Storage(options),
    file,
    cleanup: async () => fsp.rm(file)
  };
};
