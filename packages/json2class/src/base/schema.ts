import { func } from './func';
import { JsonType } from './type';
import { Complex } from './code';

export const validateRef = (complex: Complex): string | undefined => {
  const json = complex.origin;

  if (func.type(json) !== JsonType.Object) {
    return undefined;
  }

  if (json.hasOwnProperty('$ref')) {
    if (func.type(json.$ref) !== JsonType.String) {
      throw '$ref 字段必须是字符串类型';
    }
    const t = Object.keys(json);
    if (t.length !== 1) {
      throw `存在 $ref 字段时不能包含其他字段 ${t}`;
    }
    return json.$ref;
  }

  return undefined;
};
