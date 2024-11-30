import { Complex as _Complex, Simple as _Simple } from 'json2class/src/dart';
import { Http as _Http, Complex as InterComplex, Simple as InterSimple } from '../base';

export class Complex extends _Complex implements InterComplex {}
export class Simple extends _Simple implements InterSimple {}
export class Http extends _Http {
  toCode(): { context: Http; code: string } {
    return {
      context: this,
      code: `${this.nameMethod}() {}`,
    };
  }
}
