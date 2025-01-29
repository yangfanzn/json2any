import Fs from 'fs';
import Path from 'path';
import Json5 from 'json5';
import Shelljs from 'shelljs';
import * as Base from './base';
import { json2class } from '.';

export class Bin {
  readDir(
    path: string,
    {
      dic = false,
      file = true,
      recursion = true,
      ext,
      ignore,
      level = 1,
    }: {
      dic?: boolean;
      file?: boolean;
      recursion?: boolean | number;
      ext?: Array<string>;
      ignore?: RegExp;
      level?: number;
    } = {},
  ) {
    this.dirIsExist(path);

    const files = [] as Array<string>;
    Fs.readdirSync(path).forEach(each => {
      const location = Path.join(path, each).replace(/\\/g, '/');
      if (ignore) {
        if (ignore.test(location)) {
          return;
        }
      }
      const info = Fs.statSync(location);
      if (info.isDirectory()) {
        if (dic) {
          files.push(location);
        }
        if (recursion === true || level < (recursion as number)) {
          files.push(...this.readDir(location, { dic, file, recursion, ext, ignore, level: level + 1 }));
        }
      } else if (info.isFile() && file) {
        if (!ext || ext.indexOf(Path.extname(location)) >= 0) {
          files.push(location);
        }
      }
    });
    return files;
  }

  exit(err: any) {
    try {
      if (!err.inner) {
        Base.func.unreachableError(err.toString());
      }
    } catch (e) {
      err = e;
    }
    console.error(Base.env.debug ? err : err.toString());
    Shelljs.exit(1);
  }

  dirIsExist(dir: string) {
    if (!Fs.existsSync(dir) || !Fs.statSync(dir).isDirectory()) {
      Base.func.assertError('is not a valid directory', [dir]);
    }
  }

  fileIsExit(file: string) {
    if (!Fs.existsSync(file) || !Fs.statSync(file).isFile()) {
      Base.func.assertError('is not a valid file', [file]);
    }
  }

  searchJsons(dir: string) {
    return this.readDir(dir, {
      recursion: 3, // max search 3 level
      ext: ['.json5', '.json'],
      ignore: /\/\./,
    }).reduce((codes, file) => {
      codes.set(
        file
          .replace(/\.\w+$/, '')
          .split(dir)
          .pop() ?? '',
        // Object.assign return any, use as to confirm Recode type
        Object.assign({}, Json5.parse(Fs.readFileSync(file).toString())) as Record<string, any>,
      );
      return codes;
    }, new Map<string, Record<string, any>>());
  }

  class2file(jsons: Map<string, Record<string, any>>) {
    const { func, env } = Base;
    const { ext, desc } = func.language(env.language);
    const files = new Map<string, string>();
    files.set(
      `json2class.${ext}`,
      [
        func.addCopyRight('json2class'),
        func.clearComment(require(`./${desc}/temp.${ext}`).default),
        ...Array.from(jsons)
          // key is file
          .map(([key, json]) => json2class(key, json))
          .reduce((codes, cur) => {
            codes.push(...cur.toCode().map(e => e.code));
            return codes;
          }, [] as string[]),
      ].join(''),
    );
    return files;
  }
}

export const bin = new Bin();
