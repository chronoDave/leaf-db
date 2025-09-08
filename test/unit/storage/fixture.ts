import path from 'path';

export const file = path.resolve(import.meta.dirname, 'test.txt');
export const { dir, name } = path.parse(file);
