import { func } from './func';
import { JsonType } from './type';

export const validate = (json: any) => {
  if (func.type(json) !== JsonType.Object) {
    throw '不可能发生的';
  }

  if (json.hasOwnProperty('$ref')) {
    if (func.type(json.$ref) !== JsonType.String) {
      throw '$ref 字段必须是字符串类型';
    }
    const t = Object.keys(json);
    if (t.length !== 1) {
      throw `存在 $ref 字段时不能包含其他字段 ${t}`;
    }
  }

  return undefined;
};
