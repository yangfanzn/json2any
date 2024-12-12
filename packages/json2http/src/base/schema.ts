export const schemaJson = {
  type: 'object',
  properties: {
    path: { type: 'string' },
    title: { type: 'string' },
    method: { type: 'string', enum: ['get', 'post', 'put', 'delete'] },
    res: { type: 'object' },
    params: { type: 'object', additionalProperties: { type: 'string' } },
    data: { type: 'object' }, // todo: 定义 data 与 form 互斥
    form: { type: 'object' },
  },
  required: ['title', 'method', 'res'],
  additionalProperties: false,
};

export interface SchemaTs {
  path: string;
  title: string;
  method: string;
  res: Record<string, any>;
  params?: Record<string, string>;
  data?: Record<string, any>;
  form?: Record<string, any>;
}

export interface SchemaPlan<C, S> {
  // 接口外层的配置 key，总是用于生成代码的名称
  // 如果没有设置 path 字段，外层 key 同时也是接口请求的 path
  // 如果设置了 path，外层 key 就只是别名
  // 所以，虽然 path 在 schemaJson 上不是必选的，但是最后一定有值
  path: S;

  // 从 path 中分析提取
  url?: C;

  title: S;
  method: S;
  res: C;
  params?: C;
  data?: C;
  form?: C;
  args: C[];
}
