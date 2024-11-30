import Fs from 'fs';
import Path from 'path';
import { func as _func } from 'json2class';
import { Http, Complex, Simple, Supported } from './code';
import { SchemaTs } from './schema';
import json2http from '../../index';

export class Func {
  core(http: typeof Http, complex: typeof Complex, simple: typeof Simple, key: string, json: SchemaTs): Http {
    // @ts-ignore
    return new http(key, _func.core(complex, simple, 'http', json));
  }

  toFiles(jsons: Map<string, SchemaTs>, type: Supported): Map<string, string> {
    const files = new Map<string, string>();
    files.set(
      `json2http.${type}`,
      [
        Fs.readFileSync(Path.resolve(__dirname, `../src/${type}/temp.${type}`)),
        ...Array.from(jsons).reduce((codes, [key, json]) => {
          codes.push(json2http(type, key, json).toCode().code);
          return codes;
        }, [] as string[]),
      ].join('\n'),
    );
    return files;
  }
}

export const func = new Func();
