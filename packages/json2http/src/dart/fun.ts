import { _F, _I } from '../base';

class Fun extends _F implements _I {
  toFiles(jsons: Map<string, string>): Map<string, string> {
    const files = new Map<string, string>();
    console.log(Array.from(jsons.keys()));
    return files;
  }
}

export const fun = new Fun();
