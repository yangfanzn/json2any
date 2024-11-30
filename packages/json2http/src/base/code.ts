import { Complex as _Complex, Simple as _Simple } from 'json2class';
import { SchemaTs } from './schema';

export abstract class Complex extends _Complex {}
export abstract class Simple extends _Simple {}

export abstract class Http {
  protected constructor(public key: string, public config: Complex) {}
  abstract toCode(): { context: Http; code: string };

  get nameMethod() {
    return this.key.replace(/\//g, '');
  }
}
export interface InterHttp {
  toFiles(jsons: Map<string, SchemaTs>, type?: Supported): Map<string, string>;
}

export enum Supported {
  Dart = 'dart',
}
