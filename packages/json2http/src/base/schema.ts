import { Json2classBase } from 'json2class';

const methodTypes = ['GET', 'POST', 'PUT', 'DELETE'] as const;
export const contentTypes = {
  json: 'application/json',
  map: 'application/x-www-form-urlencoded',
  form: 'multipart/form-data',
  byte: 'application/octet-stream',
  plain: 'text/plain',
} as const;
export const bodyTypes = Object.keys(contentTypes);

export interface SchemaPlan {
  path: Json2classBase.Simple<Json2classBase.Complex>;
  seg?: Json2classBase.Complex;
  title: Json2classBase.Simple<Json2classBase.Complex>;
  method: Json2classBase.Simple<Json2classBase.Complex>;
  res?: Json2classBase.Complex;
  params?: Json2classBase.Complex;
  body?: SchemaBody;
  headers?: Json2classBase.Complex;
}
interface SchemaBodyBase {
  type: keyof typeof contentTypes;
}
interface SchemaBodyForm extends SchemaBodyBase {
  type: 'form';
  data: {
    fields: Json2classBase.Complex;
    files: Json2classBase.Complex;
  };
}
interface SchemaBodyOther extends SchemaBodyBase {
  type: Exclude<keyof typeof contentTypes, 'form'>;
  data?: Json2classBase.Complex | Json2classBase.Simple<Json2classBase.Complex>;
}
type SchemaBody = SchemaBodyForm | SchemaBodyOther;

const schemaPlan: Json2classBase.SchemaItem = {
  key: '',
  required: true,
  optional: false,
  array: false,
  // 以上字段均无意义，进入 json2http 核心函数前就完成了检查
  origin: null,
  child: [
    [
      {
        key: 'path',
        required: true,
        optional: false,
        array: false,
        origin: o => {
          if (Json2classBase.func.type(o) !== Json2classBase.JsonType.String) {
            // has been confirmed in core2http function before core2class
            return 'must is a string';
          }
          if (!`${o}`.startsWith('/')) {
            return 'must start with /';
          }
          return '';
        },
        child: null,
      },
      { key: 'seg', required: false, optional: false, array: false, origin: 'Record.String', child: null },
      { key: 'title', required: true, optional: false, array: false, origin: 'String', child: null },
      {
        key: 'method',
        required: true,
        optional: false,
        array: false,
        origin: o => {
          if (Json2classBase.func.type(o) !== Json2classBase.JsonType.String) {
            return 'must be a string';
          }
          if (!methodTypes.includes(o as 'GET')) {
            return `is out of the enums[${methodTypes}] range`;
          }
          return '';
        },
        child: null,
      },
      { key: 'res', required: false, optional: false, array: false, origin: 'Complex', child: null },
      { key: 'params', required: false, optional: false, array: false, origin: 'Record.String', child: null },
      {
        key: 'body',
        required: false,
        optional: false,
        array: false,
        origin: null,
        child: [
          [
            {
              key: 'type',
              required: false,
              optional: false,
              array: false,
              origin: o => (o === 'json' ? '' : 'is not json'),
              child: null,
            },
            {
              key: 'type',
              required: true,
              optional: false,
              array: false,
              origin: o => (o === 'byte' ? '' : 'is not byte'),
              child: null,
            },
            {
              key: 'type',
              required: true,
              optional: false,
              array: false,
              origin: o => (o === 'plain' ? '' : 'is not plain'),
              child: null,
            },
            {
              key: 'type',
              required: true,
              optional: false,
              array: false,
              origin: o => (o === 'map' ? '' : 'is not map'),
              child: null,
            },
            {
              key: 'type',
              required: true,
              optional: false,
              array: false,
              origin: o => (o === 'form' ? '' : 'is not form'),
              child: null,
            },
          ],
          [
            { key: 'data', required: true, optional: true, array: null, origin: null, child: [] },
            null,
            null,
            { key: 'data', required: true, optional: false, array: false, origin: 'Record.String', child: null },
            {
              key: 'data',
              required: true,
              optional: false,
              array: false,
              origin: null,
              child: [
                [
                  { key: 'fields', required: true, optional: false, array: false, origin: 'Record.Array', child: null },
                  { key: 'files', required: true, optional: false, array: false, origin: 'Record.Array', child: null },
                ],
              ],
            },
          ],
        ],
      },
      { key: 'headers', required: false, optional: false, array: false, origin: 'Record.Array', child: null },
    ],
  ],
};

export const validate = (plan: Json2classBase.Complex): SchemaPlan => {
  const { validateItem } = Json2classBase;
  plan = plan.getReal();
  const t = validateItem([], schemaPlan, plan) as Record<string, any>;
  const body = t['body'];
  if (body) {
    body.type = body.type?.origin ?? 'json';
  }
  // although it is not secure, it should be fine
  return t as SchemaPlan;
};
