import { func } from './func';
import { JsonType } from './type';
import { Complex } from './code';

export const validate = (e: Complex) => {
  const json = e.origin;
  const { index } = e;

  if (func.type(json) !== JsonType.Object) {
    func.unreachableError('complex.origin must be an object', index);
  }

  // must use Object.prototype.hasOwnProperty, json.hasOwnProperty maybe is true in json
  // use json.hasOwnProperty('$meta') will throw error
  if (Object.prototype.hasOwnProperty.call(json, '$meta')) {
    const meta = json.$meta;

    if (func.type(meta) !== JsonType.Object) {
      func.assertError('$meta must be an object', index);
    }
    const keys = Object.keys(meta);
    if (!keys.length) {
      func.assertError('$meta is not allowed to be an empty object', index);
    }

    if (keys.includes('ref')) {
      // ref config
      if (func.type(meta.ref) !== JsonType.String) {
        func.assertError('$meta.ref must be a string', index);
      }
      if (keys.length !== 1) {
        func.assertError('$meta.ref must be a unique field', index);
      }

      let ref = meta.ref;
      const i = ref.indexOf('#');
      let filename = ref.slice(0, i);
      ref = ref.slice(i + 1);
      if (i < 0) {
        func.assertError('$meta.ref is missing the anchor marker(#)', index);
      }
      if (!filename) {
        filename = e.getRoot().key;
      }

      return `${filename}#${ref}`;
    } else {
      // others
      func.assertError('$meta.ref is the only configuration currently supported', index);
    }
  }

  return '';
};
