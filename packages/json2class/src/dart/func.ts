import { Func as _Func } from '../base';

class Func extends _Func {
  arrayType(array: boolean[], type: string): string {
    return array.reduce((v, e) => {
      return `List<${v}${e ? '?' : ''}>`;
    }, type);
  }
}

export const func = new Func();
