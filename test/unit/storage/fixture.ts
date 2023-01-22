import path from 'path';

export const file = path.resolve(__dirname, 'test.txt');
export const { dir, name } = path.parse(file);
