import Fs from 'fs';
import Path from 'path';
import Json5 from 'json5';
import Shelljs from 'shelljs';
import { Supported } from '.';
import json2class from '../..';

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
    if (!Fs.existsSync(path)) {
      throw `[${path}] directory does not exist`;
    }
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

  exit(msg: string) {
    console.log(msg);
    Shelljs.exit(1);
  }

  isSupported(type: string, supported?: string[]) {
    const base = Object.values(Supported) as string[];
    if (supported) {
      if (supported.find(e => !base.includes(e))) {
        throw '不应该发生的情况'; // todo: test
      }
    } else {
      supported = base;
    }
    if (!supported.includes(type)) {
      this.exit(`The following languages are currently supported: ${supported.join(' / ')}`);
    }
  }

  searchJsons(dir: string) {
    return this.readDir(dir, { ext: ['.json5', '.json'], ignore: /\/\./ }).reduce((codes, file) => {
      codes.set(
        file
          .replace(/\.\w+$/, '')
          .split(dir)
          .pop()
          ?.replace(/\//g, '') ?? '',
        Json5.parse(Fs.readFileSync(file).toString()),
      );
      return codes;
    }, new Map<string, any>());
  }

  type = Supported.Dart;
  format = 'dart format . --line-length 120';

  class2file(jsons: Map<string, string>) {
    const files = new Map<string, string>();
    files.set(
      `json2class.${this.type}`,
      [
        Fs.readFileSync(Path.resolve(__dirname, `../src/${this.type}/temp.${this.type}`)),
        ...Array.from(jsons).reduce((codes, [key, json]) => {
          codes.push(
            ...json2class(this.type, key, json)
              .toCode()
              .map(e => e.code),
          );
          return codes;
        }, [] as string[]),
      ].join(''),
    );
    return files;
  }
}

export const bin = new Bin();
