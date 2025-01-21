import { func } from './func';
import { JsonType } from './type';
import { Complex } from './code';

export const validate = (e: Complex) => {
  const json = e.origin;

  if (func.type(json) !== JsonType.Object) {
    return '';
  }

  if (Object.prototype.hasOwnProperty.call(json, '$ref')) {
    let x = json.$ref;

    if (func.type(x) !== JsonType.String) {
      func.assertError('$ref must be a string', e.index);
    }
    const t = Object.keys(json);
    if (t.length !== 1) {
      func.assertError('$ref must be a unique field', e.index);
    }

    const i = x.indexOf('#');
    let filename = x.slice(0, i);
    const ref = x.slice(i + 1);

    if (i < 0) {
      func.assertError('$ref is missing the anchor marker(#)', e.index);
    }

    if (!filename) {
      filename = e.getRoot().key;
    }

    return `${filename}#${ref}`;
  }

  return '';
};
