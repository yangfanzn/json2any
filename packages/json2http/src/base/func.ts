import Fs from 'fs';
import Path from 'path';
import { Base } from 'json2class';
import { Http, Supported } from './code';
import { SchemaTs } from './schema';
import json2http from '../../index';

export class Func {
  core(http: typeof Http, complex: typeof Base.Complex, simple: typeof Base.Simple, key: string, json: SchemaTs): Http {
    // @ts-ignore
    return new http(
      key,
      Base.func.core(complex, simple, '', {
        ...json,
        [`params${json.params ? '' : '?'}`]: json.params ?? {},
        [`data${json.data ? '' : '?'}`]: json.data ? { ref: json.data } : {},
        [`form${json.form ? '' : '?'}`]: json.form ?? {},
      }),
    );
  }

  toFiles(jsons: Map<string, SchemaTs>, type: Supported): Map<string, string> {
    const files = new Map<string, string>();
    files.set(
      `json2http.${type}`,
      [
        `${Fs.readFileSync(Path.resolve(__dirname, `../src/${type}/temp.${type}`))}`.replace(
          /\/\/ start-cls[\s\S]+\/\/ end-cls/,
          `${Fs.readFileSync(Path.resolve(__dirname, `../../json2class/src/${type}/temp.${type}`))}`,
        ),
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
