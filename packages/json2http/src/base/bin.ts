import Fs from 'fs';
import Path from 'path';
import Ajv from 'ajv';
import { Base } from 'json2class/bin';
import { schemaJson, SchemaTs } from '.';
import json2http from '../..';

export class Bin extends Base.Bin {
  json2piece(dir: string) {
    const ajv = new Ajv();
    return Array.from(this.searchJsons(dir)).reduce((codes, [_, jsons]) => {
      Object.keys(jsons).forEach(key => {
        const json = jsons[key];
        const validate = ajv.compile(schemaJson);
        if (!validate(json)) {
          const [error] = validate.errors ?? [];
          this.exit(
            [
              `${key}:${error.instancePath}`,
              ...(validate.errors?.map(e => {
                return `${e.message} ${e.params?.allowedValues?.join(', ') ?? ''}`;
              }) ?? []),
            ].join('\n'),
          );
        }
        if (codes.has(key)) {
          this.exit(`${key} already exists`);
        }
        // schema 验证通过，这里的 http 就满足 SchemaTs
        codes.set(key, json);
      });
      return codes;
    }, new Map<string, SchemaTs>());
  }

  http2file(jsons: Map<string, SchemaTs>): Map<string, string> {
    const files = new Map<string, string>();
    const request = [] as string[];
    const deps = [] as string[];
    Array.from(jsons).forEach(([key, json]) => {
      const { code, dep } = json2http(this.type, key, json).toCode();
      request.push(code);
      deps.push(...dep.map(e => e.code));
    });
    files.set(
      `json2http.${this.type}`,
      `${Fs.readFileSync(Path.resolve(__dirname, `../src/${this.type}/temp.${this.type}`))}`
        .replace(
          /\/\/ replace-start-cls[\s\S]+\/\/ replace-end-cls/,
          `${Fs.readFileSync(Path.resolve(__dirname, `../../json2class/src/${this.type}/temp.${this.type}`))}`,
        )
        .replace(/\/\/ open |\/\* open|open \*\//g, '')
        .replace(/\/\/ replace-deps/, deps.join(''))
        .replace(/\/\/ replace-request/, request.join('')),
      // .replace(/\/\/.*|\/\*[\s\S]*?\*\//g, ''), // 简单的删除注释
    );
    return files;
  }
}

export const bin = new Bin();
