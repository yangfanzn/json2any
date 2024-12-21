import { Complex, Simple } from './code';

type JSONValue = string | number | boolean | null | JSONArray | JSONObject;
type JSONArray = JSONValue[];
type JSONObject = { [key: string]: JSONValue };
type JSONData = Exclude<JSONValue, null>;

const methodTypes = ['GET', 'POST', 'PUT', 'DELETE'] as const;
const contentTypes = {
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
        data: { type: 'object', propertyNames: { type: 'string' }, additionalProperties: { type: 'string' } },
      },
    },
    type: {} as { type: 'form'; data: Record<string, string> },
  },
  binary: {
    header: 'application/octet-stream',
    schema: {
      required: ['type'],
      properties: { type: { const: 'binary' } },
      not: { required: ['data'] },
    },
    type: {} as { type: 'binary' },
  },
  plain: {
    header: 'application/octet-stream',
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
  res: Record<string, any>;
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

export interface SchemaBody {
  type: string;
  data?: Complex | Simple;
}
