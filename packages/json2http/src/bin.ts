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

  http2file(jsons: { key: string; file: string; json: any }[], entry: string) {
    const { func, env } = Base;

    const request = [] as string[];
    const deps = [] as string[];
    const plans = [] as string[];

    Array.from(jsons)
      .map(({ key, json, file }) => json2http(key, json, file))
      .forEach(cur => {
        const { code, dep, plan } = cur.toCode();
        request.push(code);
        deps.push(...dep.map(e => e.code));
        plans.push(plan);
      });

    const { ext, temp } = func.language(env.language);
    const files = new Map<string, string>();
    files.set(
      `${entry}.${ext}`,
      [
        func.addCopyRight('json2http'),
        env.library,
        json2http()
          .toEntry()
          .replace(/@json2class@/, func.clearComment(temp))
          .replace(/@author@/, env.author)
          .replace(/@aliases@/, plans.join(''))
          .replace(/@deps@/, deps.join(''))
          .replace(/@request@/, request.join('')),
      ]
        .filter(Boolean)
        .join(''),
    );
    return files;
  }
}

export const bin = new Bin();
