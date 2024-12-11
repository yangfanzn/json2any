export const schemaJson = {
  type: 'object',
  properties: {
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
  title: string;
  method: string;
  res: Record<string, any>;
  params?: Record<string, string>;
  data?: Record<string, any>;
  form?: Record<string, any>;
}
