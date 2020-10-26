import { Projection, NewDoc, Update } from './types';
export declare const objectModify: (object: object, update: NewDoc | Update) => object;
export declare const objectProject: (object: NewDoc, projection: Projection) => {} | null;
