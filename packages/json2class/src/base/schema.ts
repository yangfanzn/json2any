import { func } from './func';
import { BaseType } from './type';
import { Complex, Simple } from './code';

const check = (self: Complex | Simple<Complex>, title: string, parent: Complex) => {
  if (self.parent?.child.length !== 1) {
    func.assertError(`${title} must be a unique field under its parent`, parent);
  }
  if (self.optional) {
    func.assertError(`${title} cannot be set to optional`, parent);
  }
  if (self.array.length) {
    func.assertError(`${title} cannot be set to array`, parent);
  }
};

export const validate = (e: Complex) => {
  const $meta = e.getChildByKey('$meta', false, null);
  if (!$meta) {
    return '';
  } else if (!($meta instanceof Complex)) {
    return func.assertError('$meta must be an object', e);
  }
  check($meta, '$meta', e);

  const ref = $meta.getChildByKey('ref', false, null);
  if (ref) {
    if (ref instanceof Complex || ref.type !== BaseType.String) {
      return func.assertError('$meta.ref must be a string', e);
    }
    check(ref, '$meta.ref', e);

    let index = ref.origin as string;
    const i = index.indexOf('#');
    let filename = index.slice(0, i);
    index = index.slice(i + 1);
    if (i < 0) {
      func.assertError('$meta.ref is missing the anchor marker(#)', e);
    }
    if (!filename) {
      filename = e.getRoot().key;
    }

    return `${filename}#${index}`;
  }

  return func.assertError('$meta.ref is the only configuration currently supported', e);
};
