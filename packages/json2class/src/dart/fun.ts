import Fs from 'fs';
import Path from 'path';
import { _F, _I } from '../base';
import Json2class from '../../index';

class Fun extends _F implements _I {
  arrayType(array: boolean[], type: string): string {
    return array.reduce((v, e) => {
      return `List<${v}${e ? '?' : ''}>`;
    }, type);
  }

  toFiles(jsons: Map<string, string>) {
    const files = new Map<string, string>();
    files.set(
      'index.dart',
      [
        Fs.readFileSync(Path.resolve(__dirname, '../src/dart/temp.dart')),
        ...Array.from(jsons).reduce((codes, [name, json]) => {
          codes.push(
            ...Json2class('dart', name, json)
              .toClass()
              .map(e => e.code),
          );
          return codes;
        }, [] as string[]),
      ].join('\n'),
    );
    return files;
  }
}

export const fun = new Fun();
