import Fs from 'fs';
import Path from 'path';
import { Json2classBin } from 'json2class/bin';
import { json2http } from '.';
import * as Base from './base';

export class Bin extends Json2classBin.Bin {
  json2piece(dir: string) {
    return Array.from(this.searchJsons(dir)).reduce((codes, [file, jsons]) => {
      codes.push(...Object.keys(jsons).map(key => ({ key, json: jsons[key], file })));
      return codes;
    }, [] as { key: string; json: any; file: string }[]);
  }

  http2file(jsons: { key: string; file: string; json: any }[]) {
    const { func, env } = Base;

    let toEntry = '';

    const request = [] as string[];
    const deps = [] as string[];
    const aliases = [] as string[];

    Array.from(jsons)
      .map(({ key, json, file }) => json2http(key, json, file))
      .forEach(({ http, Http }) => {
        toEntry ||= Http.toEntry();
        const { code, dep, alias } = http.toCode();
        request.push(code);
        deps.push(...dep.map(e => e.code));
        aliases.push(alias);
      });

    const { ext, desc } = func.language(env.language);
    const files = new Map<string, string>();
    files.set(
      `json2http.${ext}`,
      [
        func.addCopyRight('json2http'),
        toEntry
          .replace(
            /@json2class@/,
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
    const extend = { path: '', agent: '' };
    if (extendPath) {
      const file = `${Fs.readFileSync(extendPath)}`;
      const [, disabled, , name] =
        file.match(/(\/\/\s+@json2http-disabled(\s+))?class\s+(\w+)\s+extends\s+Agent\s+/) ?? [];
      extend.path = Path.relative(outputPath, extendPath);
      extend.agent = disabled ? '' : name ?? '';
      if (extend.agent) {
        if (!/class\s+MultipartFile\b/.test(file)) {
          Fs.appendFileSync(extendPath, '\nclass MultipartFile {}');
        }
      }
    }
    return extend;
  }
}

export const bin = new Bin();
