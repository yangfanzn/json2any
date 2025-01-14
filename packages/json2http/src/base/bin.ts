import Fs from 'fs';
import Path from 'path';
import { Json2classBin } from 'json2class/bin';
import { SchemaTs, validate } from './schema';
import { func } from './func';
import json2http from '../..';

export class Bin extends Json2classBin.Bin {
  json2piece(dir: string) {
    return Array.from(this.searchJsons(dir)).reduce((codes, [_, jsons]) => {
      Object.keys(jsons).forEach(key => {
        const json = jsons[key];
        const error = validate(json);
        if (error) {
          func.assertError(`${_} ${key} ${error}`);
        }
        if (codes.has(key)) {
          func.assertError(`${key} already exists`);
        }
        // schema 验证通过，这里的 http 就满足 SchemaTs
        codes.set(key, json);
      });
      return codes;
    }, new Map<string, SchemaTs>());
  }

  http2file(jsons: Map<string, SchemaTs>) {
    let toEntry = '';

    const request = [] as string[];
    const deps = [] as string[];
    const aliases = [] as string[];

    Array.from(jsons)
      .map(([key, json]) => json2http(key, json))
      .forEach(({ http, Http }) => {
        toEntry ||= Http.toEntry();
        const { code, dep, alias } = http.toCode();
        request.push(code);
        deps.push(...dep.map(e => e.code));
        aliases.push(alias);
      });

    const { ext, desc } = func.language(func.envJson2http.language);
    const files = new Map<string, string>();
    files.set(
      `json2http.${ext}`,
      [
        func.addCopyRight('json2http'),
        toEntry
          .replace(
            /@cls@/,
            func.clearComment(
              Fs.readFileSync(Path.resolve(__dirname, `../../json2class/src/${desc}/temp.${ext}`)).toString(),
            ),
          )
          .replace(/@aliases@/, aliases.join(''))
          .replace(/@deps@/, deps.join(''))
          .replace(/@request@/, request.join('')),
      ].join(''),
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
