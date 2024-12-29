import { Json2classBase } from 'json2class';

type JSONValue = string | number | boolean | null | JSONArray | JSONObject;
type JSONArray = JSONValue[];
type JSONObject = { [key: string]: JSONValue };
type JSONData = Exclude<JSONValue, null>;

const methodTypes = ['GET', 'POST', 'PUT', 'DELETE'] as const;
export const contentTypes = {
  json: {
    header: 'application/json',
    schema: {
      required: ['data'],
      properties: {
        type: { const: 'json' },
        data: { not: { type: 'null' } },
      },
    },
    type: {} as { type?: 'json'; data: JSONData },
  },
  map: {
    header: 'application/x-www-form-urlencoded',
    schema: {
      required: ['type', 'data'],
      properties: {
        type: { const: 'map' },
        data: { type: 'object', propertyNames: { type: 'string' }, additionalProperties: { type: 'string' } },
      },
    },
    type: {} as { type: 'map'; data: Record<string, string> },
  },
  form: {
    header: 'multipart/form-data',
    schema: {
      required: ['type', 'data'],
      properties: {
        type: { const: 'form' },
        data: {
          type: 'object',
          additionalProperties: false,
          required: ['fields', 'files'],
          properties: {
            fields: {
              type: 'object',
              propertyNames: { type: 'string' },
              additionalProperties: { anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] },
            },
            files: {
              type: 'object',
              propertyNames: { type: 'string' },
              additionalProperties: { anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] },
            },
          },
        },
      },
    },
    type: {} as {
      type: 'form';
      data: { fields: Record<string, string | string[]>; files: Record<string, string | string[]> };
    },
  },
  byte: {
    header: 'application/octet-stream',
    schema: {
      required: ['type'],
      properties: { type: { const: 'byte' } },
      not: { anyOf: [{ required: ['data'] }, { required: ['byte'] }] },
    },
    type: {} as { type: 'byte' },
  },
  plain: {
    header: 'text/plain',
    schema: {
      required: ['type', 'data'],
      properties: { type: { const: 'plain' }, data: { type: 'string' } },
    },
    type: {} as { type: 'plain'; data: string },
  },
} as const;

type Method = (typeof methodTypes)[number];
type ContentTypes = typeof contentTypes;
type BodyTs = {
  [K in keyof ContentTypes]: ContentTypes[K]['type'];
}[keyof ContentTypes];

export const schemaJson = {
  type: 'object',
  properties: {
    path: { type: 'string' },
    title: { type: 'string' },
    method: { type: 'string', enum: methodTypes },
    res: { type: 'object' },
    params: { type: 'object', additionalProperties: { type: 'string' } },
    body: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: Object.keys(contentTypes) },
        data: {},
      },
      additionalProperties: false,
      oneOf: Object.values(contentTypes).map(e => e.schema),
    },
  },
  required: ['title', 'method', 'res'],
  additionalProperties: false,
};

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
