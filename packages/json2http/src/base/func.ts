import Fs from 'fs';
import Path from 'path';
import { Base } from 'json2class';
import { Http, Supported, Complex, Simple } from './code';
import { SchemaTs } from './schema';
import json2http from '../../index';

export class Func {
  core(
    http: typeof Http<Complex, Simple>,
    complex: typeof Complex,
    simple: typeof Simple,
    key: string,
    json: SchemaTs,
  ): Http {
    // @ts-ignore
    return new http(
      key,
      Base.func.core(complex as typeof Base.Complex, simple as typeof Base.Simple, '', {
        ...json,
        [`params${json.params ? '' : '?'}`]: json.params ?? {},
        [`data${json.data ? '' : '?'}`]: json.data ?? {},
        [`form${json.form ? '' : '?'}`]: json.form ?? {},
      }),
    );
  }

  toFiles(jsons: Map<string, SchemaTs>, type: Supported): Map<string, string> {
    const files = new Map<string, string>();
    const codes = [] as string[];
    const deps = [] as string[];
    Array.from(jsons).forEach(([key, json]) => {
      const { code, dep } = json2http(type, key, json).toCode();
      codes.push(code);
      deps.push(...dep.map(e => e.code));
    });
    files.set(
      `json2http.${type}`,
      [
        `${Fs.readFileSync(Path.resolve(__dirname, `../src/${type}/temp.${type}`))}`.replace(
          /\/\/ start-cls[\s\S]+\/\/ end-cls/,
          `${Fs.readFileSync(Path.resolve(__dirname, `../../json2class/src/${type}/temp.${type}`))}`,
        ),
        ...deps,
        ...codes,
      ].join('\n'),
    );
    return files;
  }
}

export const func = new Func();
