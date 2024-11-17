import { _F, _I } from '../base';

class Fun extends _F implements _I {
  arrayType(array: boolean[], type: string): string {
    return array.reduce((v, e) => {
      return `List<${v}${e ? '?' : ''}>`;
    }, type);
  }
}

export const fun = new Fun();
