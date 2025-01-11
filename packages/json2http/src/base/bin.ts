import Fs from 'fs';
import Path from 'path';
import Ajv from 'ajv';
import { Json2classBin } from 'json2class/bin';
import { schemaJson, SchemaTs } from './schema';
import { Supported } from './type';
import json2http from '../..';

export class Bin extends Json2classBin.Bin {
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
              `${key}:${error?.instancePath}`,
              ...(validate.errors?.map(e => {
                return `${e.message} ${e.params?.['allowedValues']?.join(', ') ?? ''}`;
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

  http2file(jsons: Map<string, SchemaTs>, type: Supported): Map<string, string> {
    let toEntry = '';

    const request = [] as string[];
    const deps = [] as string[];
    const aliases = [] as string[];

    Array.from(jsons)
      .map(([key, json]) => json2http(type, key, json))
      .forEach(({ http, Http }) => {
        toEntry ||= Http.toEntry();
        const { code, dep, alias } = http.toCode();
        request.push(code);
        deps.push(...dep.map(e => e.code));
        aliases.push(alias);
      });

    const files = new Map<string, string>();
    files.set(
      `json2http.${type}`,
      toEntry
        .replace(/@cls@/, `${Fs.readFileSync(Path.resolve(__dirname, `../../json2class/src/${type}/temp.${type}`))}`)
        .replace(/@aliases@/, aliases.join(''))
        .replace(/@deps@/, deps.join(''))
        .replace(/@request@/, request.join('')),
    );
    return files;
  }

  parseExtend(outputPath: string, extendPath: string) {
    const extend = { path: '', executor: '' };
    if (extendPath) {
      const file = `${Fs.readFileSync(extendPath)}`;
      const [, disabled, , name] =
        file.match(/(\/\/\s+@json2http-disabled(\s+))?class\s+(\w+)\s+extends\s+Executor\s+/) ?? [];
      extend.path = Path.relative(outputPath, extendPath);
      extend.executor = disabled ? '' : name ?? '';
      if (extend.executor) {
        if (!/class\s+MultipartFile\b/.test(file)) {
          Fs.appendFileSync(extendPath, '\nclass MultipartFile {}');
        }
      }
    }
    return extend;
  }
}

export const bin = new Bin();
