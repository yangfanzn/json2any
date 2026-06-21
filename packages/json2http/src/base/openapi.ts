export class OpenApi {
  private params(item: any, uri: string): any {
    if (!item?.parameters || !Array.isArray(item.parameters)) {
      return;
    }

    const required: string[] = [];
    const properties: Record<string, any> = {};
    for (let param of item.parameters) {
      param = Object.assign({}, param);
      if (param.in !== 'query') continue;
      if (!param.name) {
        // todo: 报错或打日志
        continue;
      }
      if (!['string', 'number', 'integer', 'boolean'].includes(this.type2nullable(param.schema ?? {})[0])) {
        // todo: 报错或打日志
        continue;
      }
      if (param.required) {
        required.push(param.name);
      }
      properties[param.name] = param.schema;
    }

    return this.schema2json({ properties, required }, `${uri}#/params`, [], false);
  }

  private body(item: any, uri: string): any {
    const body = item?.requestBody?.content;
    if (!body) return;

    const content = Object.assign({}, body);

    const keys = Object.keys(content);
    const [type, media] = new Array<[string, (k: string) => boolean]>(
      ['json', k => k.includes('json')],
      ['map', k => k.includes('form-urlencoded') || k.includes('x-www-form-urlencoded')],
      ['form', k => k.includes('form-data')],
      ['byte', k => k.includes('octet-stream') || k.includes('binary')],
      ['plain', k => k.includes('plain') || k.includes('text')],
    ).reduce((acc, [type, fn]) => {
      if (acc.length) return acc;
      const key = keys.find(fn);
      return key ? [type, key] : [];
    }, [] as string[]);

    if (!type || !media) {
      // todo: 报错或打日志
      return;
    }

    const schema = Object.assign({}, content[media]?.schema);
    const [, nullable] = this.type2nullable(schema);

    switch (type) {
      case 'json': {
        const data = this.schema2json(schema, `${uri}#/body/data`, [], false);
        if (data === undefined) {
          return;
        }
        return { type, [`data${nullable ? '?' : ''}`]: data };
      }
      case 'map': {
        const properties = Object.assign({}, schema.properties);
        const data = this.schema2json(
          Object.keys(properties).reduce(
            (a, e) => {
              const prop = properties[e];
              if (['string', 'number', 'integer', 'boolean'].includes(this.type2nullable(prop)[0])) {
                a.properties[e] = prop;
              }
              return a;
            },
            { ...schema, properties: {} } as { properties: Record<string, any> },
          ),
          `${uri}#/body/data`,
          [],
          false,
        );
        if (data === undefined) {
          return;
        }
        return { type, data };
      }
      case 'form': {
        const properties = Object.assign({}, schema.properties);
        const required = Array.isArray(schema.required) ? schema.required : [];
        const init = () => ({ type: 'object', properties: {} as Record<string, any>, required });
        const data = this.schema2json(
          Object.keys(properties).reduce(
            (a, e) => {
              const prop = Object.assign({}, properties[e]);
              const item = Object.assign({}, this.type2nullable(prop)[0] === 'array' ? prop.items : prop);
              if (['binary', 'base64'].includes(item.format)) {
                a.properties.files.properties[e] = prop;
              } else if (['string', 'number', 'integer', 'boolean'].includes(this.type2nullable(item)[0])) {
                a.properties.fields.properties[e] = prop;
              }
              return a;
            },
            {
              type: 'object',
              properties: { fields: init(), files: init() },
              required: ['fields', 'files'],
            },
          ),
          `${uri}#/body/data`,
          [],
          false,
        );
        if (data === undefined) {
          return;
        }
        if (!data.fields) {
          data.fields = {};
        }
        if (!data.files) {
          data.files = {};
        }
        return { type, data };
      }
      case 'byte':
      case 'plain':
        return { type, [`data${nullable ? '?' : ''}`]: '' };
    }
  }

  private res(item: any, uri: string): any {
    if (!item?.responses) {
      return;
    }

    const responses = Object.assign({}, item.responses);
    let code;
    if (responses['200']) {
      code = '200';
    } else if (responses['201']) {
      code = '201';
    } else {
      const keys = Object.keys(responses);
      code = keys.find(c => c.startsWith('2')) ?? keys[0];
    }
    if (!code) {
      return;
    }

    const content = Object.assign({}, responses[code]?.content);
    let media;
    if (content['application/json']) {
      media = 'application/json';
    } else {
      // 按通配程度排序，取最具体的：type/subtype > type/* > */*
      const score = (k: string) => (k === '*/*' ? 0 : k.endsWith('/*') ? 1 : 2);
      media = Object.keys(content).reduce(
        (best, k) => (best === undefined || score(k) > score(best) ? k : best),
        undefined as string | undefined,
      );
    }
    if (!media) {
      return;
    }

    const data = this.schema2json(content[media]?.schema, `${uri}#/res`, [], true);
    if (
      Object.prototype.toString.call(data).slice(8, -1).toLowerCase() !== 'object' ||
      Object.keys(data).length === 0
    ) {
      return;
    }
    return data;
  }

  // 兼容 OpenAPI 3.0 和 3.1 的 type/nullable 定义
  private type2nullable(v: any) {
    return Array.isArray(v?.type)
      ? [v.type.find((e: string) => e !== 'null'), v.type.includes('null')]
      : [v?.type, v?.nullable];
  }

  // openapi 3.x 中 components/schemas 的索引 与 json2http $ref 映射表
  private maps: Record<string, string> = {};
  // json2http $ref 引用统计，用于判断是否需要提取为组件入口
  private indexes: Record<string, { count: number; uri: string }> = {};

  private schema2json(schema: any, uri: string, refs: string[], isRes: boolean): any {
    schema = Object.assign({}, schema);
    let [type] = this.type2nullable(schema);
    if (!type && schema.properties) {
      type = 'object';
    }
    switch (type) {
      case 'string':
        return '';
      case 'number':
      case 'integer':
        return 0;
      case 'boolean':
        return false;
      case 'object': {
        const properties = Object.assign({}, schema.properties);
        const required = Array.isArray(schema.required) ? schema.required : [];
        return Object.keys(properties).reduce((a, e) => {
          const prop = properties[e];
          const v = this.schema2json(prop, `${uri}/${e}`, refs, isRes);
          if (v === undefined) {
            return a;
          }
          if (a === undefined) {
            a = {};
          }
          a[`${e}${!this.type2nullable(prop)[1] && (isRes || required.includes(e)) ? '' : '?'}`] = v;
          return a;
        }, undefined as Record<string, any> | undefined);
      }
      case 'array': {
        if (!Array.isArray(schema.items)) {
          // 仅支持单类型数组
          const v = this.schema2json(schema.items, uri, refs, isRes);
          if (v !== undefined) {
            return this.type2nullable(schema.items)[1] ? [v, null] : [v];
          }
        }
        return;
      }
      case 'null':
      // 类型是 'null' 本身的不处理，json2http 没有这样的支持
      default:
        if (schema.allOf || schema.oneOf || schema.anyOf) {
          // 忽略 allOf、oneOf、anyOf 等复杂结构，直接返回 undefined
        }
    }

    // $ref
    if (schema.$ref) {
      const ref = schema.$ref.toString();
      const target = this.origin.components?.schemas?.[ref.replace('#/components/schemas/', '')];
      if (!target) {
        // todo: 报错或打日志
        return;
      }

      if (this.useRef) {
        const k = JSON.stringify([ref, isRes]);
        if (!this.indexes[k]) {
          this.indexes[k] = { count: 1, uri };
        } else {
          this.indexes[k].count++;
        }
        if (this.indexes[k].count > 1) {
          // 出现重复引用，改为 $meta.ref 引用
          return { $meta: { ref: this.indexes[k].uri } };
        }
        return this.schema2json(target, uri, [...refs, ref], isRes);
      } else {
        if (refs.includes(ref)) {
          // 循环引用，停止展开
          return { $meta: { ref: this.maps[ref] } };
        }
        this.maps[ref] = uri;
        return this.schema2json(target, uri, [...refs, ref], isRes);
      }
    }
  }

  private paramsMerge(ms: any, m: any) {
    const msp = Array.isArray(ms?.parameters) ? [...ms.parameters] : [];
    const mp = Array.isArray(m?.parameters) ? [...m.parameters] : [];
    if (msp.length === 0) return mp;
    if (mp.length === 0) return msp;
    const mKeys = new Set(mp.map((p: any) => `${p.in}:${p.name}`));
    return [...mp, ...msp.filter((p: any) => !mKeys.has(`${p.in}:${p.name}`))];
  }

  constructor(public origin: any, public useRef: boolean) {
    this.origin = Object.assign({}, origin);
  }

  parse() {
    const t = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'TRACE', 'CONNECT'];
    const paths = Object.assign({}, this.origin.paths);
    return JSON.stringify(
      Object.keys(paths).reduce((a, e) => {
        const methods = Object.assign({}, paths[e]);
        const multi = Object.keys(methods).filter(k => t.includes(k.toUpperCase())).length > 1;
        return Object.assign(
          a,
          Object.keys(methods).reduce((aa, ee) => {
            const method = ee.toUpperCase();
            if (!t.includes(method)) {
              return aa;
            }
            // todo: multi 情况下有重复风险
            const uri = `${e}${multi ? `/${method}` : ''}`;
            const item = Object.assign({}, methods[ee]);
            const combined = { ...item, parameters: this.paramsMerge(methods, item) };
            return Object.assign(aa, {
              [uri]: {
                title: item.summary || '',
                method,
                path: multi ? e : undefined,
                params: this.params(combined, uri),
                body: this.body(combined, uri),
                res: this.res(combined, uri),
              },
            });
          }, {} as Record<string, any>),
        );
      }, {} as Record<string, Record<string, any>>),
      null,
      2,
    );
  }
}
