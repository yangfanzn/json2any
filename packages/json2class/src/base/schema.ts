import { func } from './func';
import { JsonType } from './type';
import { Complex } from './code';

export const validate = (complex: Complex) => {
  const json = complex.origin;

  if (func.type(json) !== JsonType.Object) {
    return '';
  }

  if (json.hasOwnProperty('$ref')) {
    if (func.type(json.$ref) !== JsonType.String) {
      func.assertError('$ref must be a string');
    }
    const t = Object.keys(json);
    if (t.length !== 1) {
      func.assertError(`$ref is mutually exclusive with other fields`, t.join());
    }
    return json.$ref;
  }

  return '';
};
