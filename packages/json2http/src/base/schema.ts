export const schemaJson = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    method: { type: 'string', enum: ['get', 'post', 'put', 'delete'] },
    res: { type: 'object' },
    params: { type: 'object', additionalProperties: { type: 'string' } },
    form: { type: 'object' },
    data: {
      oneOf: [{ type: 'object' }, { type: 'array' }, { type: 'string' }, { type: 'number' }, { type: 'boolean' }],
    },
  },
  required: ['title', 'method', 'res'],
  additionalProperties: false,
};

export interface SchemaTs {
  title: string;
  method: string;
  res: Record<string, any>;
  params?: Record<string, string>;
  form?: Record<string, any>;
  data?: Record<string, any> | any[] | string | number | boolean;
}
