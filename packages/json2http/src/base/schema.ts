import { Json2classBase } from 'json2class';

type JSONValue = string | number | boolean | null | JSONArray | JSONObject;
type JSONArray = JSONValue[];
type JSONObject = { [key: string]: JSONValue };
type JSONData = Exclude<JSONValue, null>;

const methodTypes = ['GET', 'POST', 'PUT', 'DELETE'] as const;
export const contentTypes = {
  json: {
    header: 'application/json',
    type: {} as { type?: 'json'; data: JSONData },
  },
  map: {
    header: 'application/x-www-form-urlencoded',
    type: {} as { type: 'map'; data: Record<string, string> },
  },
  form: {
    header: 'multipart/form-data',
    type: {} as {
      type: 'form';
      data: { fields: Record<string, string | string[]>; files: Record<string, string | string[]> };
    },
  },
  byte: {
    header: 'application/octet-stream',
    type: {} as { type: 'byte' },
  },
  plain: {
    header: 'text/plain',
    type: {} as { type: 'plain'; data: string },
  },
} as const;

type Method = (typeof methodTypes)[number];
type ContentTypes = typeof contentTypes;
type BodyTs = {
  [K in keyof ContentTypes]: ContentTypes[K]['type'];
}[keyof ContentTypes];

export interface SchemaTs {
  res: Record<string, JSONValue>;
  path: string;
  title: string;
  method: Method;
  params?: Record<string, string>;
  body?: BodyTs;
}

export interface SchemaPlan<C, S> {
  res: C;

  // 接口外层的配置 key，总是用于生成代码的名称
  // 如果没有设置 path 字段，外层 key 同时也是接口请求的 path
  // 如果设置了 path，外层 key 就只是别名
  // 所以，虽然 path 在 schemaJson 上不是必选的，但是最后一定有值
  path: S;

  // 从 path 中分析提取
  seg?: C;

  title: S;
  method: S;

  params?: C;
  body?: C;
}

interface SchemaBodyBase {
  type: BodyTs['type'];
}
interface SchemaBodyForm extends SchemaBodyBase {
  type: 'form';
  data: {
    fields: Json2classBase.Complex;
    files: Json2classBase.Complex;
  };
}
interface SchemaBodyOther extends SchemaBodyBase {
  type: Exclude<BodyTs['type'], 'form'>;
  data?: Json2classBase.Complex | Json2classBase.Simple<Json2classBase.Complex>;
}
export type SchemaBody = SchemaBodyForm | SchemaBodyOther;

const bodyTypes = Object.keys(contentTypes);
export const validate = (json: any) => {
  const { JsonType, func } = Json2classBase;

  json = Object.assign({}, json);

  if (['title', 'method', 'res'].findIndex(k => !json.hasOwnProperty(k)) >= 0) {
    return 'title method res are required';
  }

  if (!methodTypes.includes(json.method)) {
    return `method is out of the enums[${methodTypes}] range`;
  }

  if (func.type(json.res) !== JsonType.Object) {
    return 'res must be an object';
  }

  if (json.hasOwnProperty('params')) {
    if (func.type(json.params) === JsonType.Object) {
      if (!Object.values(json.params).filter(e => func.type(e) !== JsonType.String).length) {
        return '';
      }
    }
    return `params must be an record${func.addX('string, string')}`;
  }

  if (json.hasOwnProperty('body')) {
    if (func.type(json.body) !== JsonType.Object) {
      return 'body must be an object';
    }
    if (json.body.hasOwnProperty('type')) {
      if (!bodyTypes.includes(json.body.type)) {
        return `body.type is out of the enums[${bodyTypes}] range`;
      }
    }
    if (json.body.type !== 'byte' && (json.body.data === null || json.body.data === undefined)) {
      return 'except for body.type = byte, body.data must exist and cannot be null';
    }

    if (json.body.type === 'map') {
      if (func.type(json.body.data) === JsonType.Object) {
        if (!Object.values(json.body.data).filter(e => func.type(e) !== JsonType.String).length) {
          return '';
        }
      }
      return `body.map.data must be an record${func.addX('string, string')}`;
    } else if (json.body.type === 'form') {
      if (
        func.type(json.body.data) === JsonType.Object &&
        func.type(json.body.data.fields) === JsonType.Object &&
        func.type(json.body.data.files) === JsonType.Object
      ) {
        const keys = Object.assign({}, json.body.data.fields, json.body.data.files);
        let conflict = '';
        if (
          !Object.keys(keys).filter(k => {
            conflict = json.body.data.fields.hasOwnProperty(k) && json.body.data.files.hasOwnProperty(k) ? k : '';
            const e = keys[k];
            if (func.type(e) === JsonType.Array) {
              return (e as []).find(ee => func.type(ee) !== JsonType.String);
            }
            return func.type(e) !== JsonType.String;
          }).length
        ) {
          if (conflict) {
            return `fields and files in body.form.data has conflict field name of ${conflict}`;
          }
          return '';
        }
      }
      return `fields and files in body.form.data must be an record${func.addX('string, string | string[]')}`;
    } else if (json.body.type === 'plain') {
      if (func.type(json.body.data) !== JsonType.String) {
        return 'body.plain.data must be an string';
      }
    } else if (json.body.type === 'byte') {
      if (json.body.hasOwnProperty('data')) {
        return 'body.byte.data is forbidden to set';
      }
    }
  }

  return '';
};
