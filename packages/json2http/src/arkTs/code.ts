import { Json2classArkTs } from 'json2class';
import * as Base from '../base';

export class Complex extends Json2classArkTs.Complex {}

export class Simple extends Json2classArkTs.Simple {}

export class Http extends Base.Http<Complex, Simple> {
  toLaunch(plan: Base.SchemaPlan) {
    const { addX, convertWrap } = Base.func;

    const { body } = plan;

    let bodyDef = 'null';
    if (body) {
      if (body.type === 'form') {
        bodyDef = `new Body('${body.type}', new BodyForm(${body.data.fields.def}, ${body.data.files.def}))`;
      } else if (body.data?.array.length) {
        bodyDef = `new Body${addX(
          `${plan.title.lang.arrayType(body.data.array, body.data.decl)}${body.data.optional ? ' | null' : ''}`,
        )}('${body.type}', [])`;
      } else if (body.type === 'plain') {
        bodyDef = `new Body${addX(`string${body.data?.optional ? ' | null' : ''}`)}('${body.type}', '')`;
      } else if (body.type === 'byte') {
        bodyDef = `new Body${addX(`Uint8Array${body.data?.optional ? ' | null' : ''}`)}('${
          body.type
        }', new Uint8Array(0))`;
      } else if (body.data) {
        bodyDef = `new Body${addX(`${body.data.decl}${body.data.optional ? ' | null' : ''}`)}('${body.type}', ${
          body.data.def
        })`;
      } else {
        Base.func.unreachableError(`[${plan.path.origin}] unknown body type parsing`);
      }
    }

    const types = [
      `path = '${plan.path.origin}'`,
      `seg = ${plan.seg?.def ?? 'null'}`,
      `readonly title = '${convertWrap(plan.title.origin.toString())}'`,
      `method = '${plan.method.origin}'`,
      `res = ${plan.res?.def ?? 'null'}`,
      `params = ${plan.params?.def ?? 'null'}`,
      `body = ${bodyDef}`,
      `headers: Record${addX('string, Any')} = JSON.parse('${convertWrap(
        JSON.stringify(plan.headers?.origin ?? {}),
      )}')`,
    ].join(';');

    return {
      code: `
async ${this.launch}(setPlan: (plan: ${this.declPlan}) => void): Promise${addX(this.declPlan)} {
  const plan = new ${this.declPlan}();
  await Json2http.setPlan?.(plan);
  await setPlan(plan);
  await (plan.start ?? plan.request)();
  return plan;
} // ${plan.path.origin}`,
      plan: `
export class ${this.declPlan} extends Plan { ${types}; }`,
    };
  }

  static get agentConfig() {
    const { func, env, DefaultAgent } = Base;
    switch (env.defaultAgent) {
      case DefaultAgent.ArkTs_Rcp12:
        return {
          name: 'RcpAgent',
          import: `import { util as _Util } from '@kit.ArkTS';
import { rcp as _Rcp } from '@kit.RemoteCommunicationKit';
import { fileUri as _FileUri } from '@kit.CoreFileKit';`,
          code: `
export class RcpAgent extends Agent {
  private static session = _Rcp.createSession();
  
  session: _Rcp.Session | null = null;
  option: _Rcp.Request | null = null;
  response: _Rcp.Response | null = null;

  async fetch(plan: Plan): Promise${func.addX('Reply')}  {
    const session = this.session ?? RcpAgent.session;

    let path = plan.path;
    if (plan.seg) {
      const seg = plan.seg?.toJson();
      path = path.replace(/{(.*?)}/g, (_, k: string) => seg?.[k]?.toString() ?? '');
    }
    path = \`\${plan.baseURL}\${path}\`;
    const q = _obj2get(plan.params?.toJson() ?? {});
    path = \`\${path}\${q ? (path.includes('?') ? '&' : '?') : ''}\${q}\`;

    if (plan.body?.contentType) {
      plan.headers['content-type'] = plan.body.contentType;
    }

    const option = this.option =
      new _Rcp.Request(path, plan.method, plan.headers as _Rcp.RequestHeaders, await this.body(plan) ?? undefined);

    await plan.ready?.();

    const response = this.response = await session.fetch(option).finally(() => this.session?.close());
    plan.reply.code = response.statusCode;
    plan.reply.message = _code2message[plan.reply.code ?? 0] ?? \`unknown http code \${plan.reply.code}\`;

    try {
      plan.reply.data = response.body ?? null;
      plan.reply.data = response.toJSON() ?? plan.reply.data;
    } catch (_) {}

    return plan.reply;
  }

  body(plan: Plan): Any {
    const type = plan.body?.type ?? null;
    const data = plan.body?.data ?? null;
    if (type === null) {
      return null;
    } else if (type === 'json') {
      return JSON.stringify(
        data instanceof Array ? 
          data.map((e: Any) => e instanceof Json2class ? _nullFilter(e.toJson()) : e) : 
          (data instanceof Json2class ? _nullFilter(data.toJson()) : data)
      );
    } else if (type === 'map' && data instanceof Json2class) {
      return _obj2get(data.toJson());
    } else if (type === 'form' && data instanceof BodyForm) {
      const a2b = (a: BodyFormFile) => {
        if (a.file !== null) {
          return { contentOrPath: a.file, remoteFileName: a.filename ?? new _FileUri.FileUri(a.file).name, contentType: a.contentType } as _Rcp.FormFieldFileValue;
        } else if (a.content !== null) {
          return { contentOrPath: { content: a.content.buffer }, remoteFileName: a.filename, contentType: a.contentType } as _Rcp.FormFieldFileValue
        }
        return null;
      };
      const map: _Rcp.MultipartFormFields = {};
      type V = _Rcp.MultipartFormFieldValue;
      const cb = (data: Record${func.addX('string, Any')}) => Object.keys(data).forEach(k => {
        if (map[k] === undefined) {
          map[k] = [];
        }
        const v = ((data[k] instanceof Array ? data[k] : [data[k]]) as Array${func.addX('Any')})
          .map(e => e instanceof BodyFormFile ? a2b(e) : e as _Rcp.FormFieldValue)
          .filter(e => e !== null) as Array${func.addX('V')};
        (map[k] as Array${func.addX('V')}).push(...v);
      });
      cb((data as BodyForm).fields.toJson());
      cb((data as BodyForm).files.toJson());
      return new _Rcp.MultipartForm(map);
    } else if (data instanceof Uint8Array) {
      return data.buffer;
    } else {
      return data;
    }
  }
}`,
        };
      case DefaultAgent.Typescript_Axios1:
        return {
          name: 'AxiosAgent',
          import: `import * as _Axios from 'axios';
import type * as _AxiosTypes from 'axios';`,
          code: `
export class AxiosAgent extends Agent {
  private static session = _Axios.default.create({ responseType: 'blob', validateStatus: () => true });

  session: _AxiosTypes.Axios | null = null;
  option: _AxiosTypes.AxiosRequestConfig | null = null;
  response: _AxiosTypes.AxiosResponse | null = null;

  async fetch(plan: Plan): Promise${func.addX('Reply')} {
    const session = this.session ?? AxiosAgent.session;

    let path = plan.path;
    if (plan.seg) {
      const seg = plan.seg?.toJson();
      path = path.replace(/{(.*?)}/g, (_, k: string) => seg?.[k]?.toString() ?? '');
    }

    const q = _obj2get(plan.params?.toJson() ?? {});
    path = \`\${path}\${q ? (path.includes('?') ? '&' : '?') : ''}\${q}\`;

    if (plan.body?.contentType && plan.body.type !== 'form') {
      plan.headers['content-type'] = plan.body.contentType;
    }

    const option = (this.option = {
      url: path,
      method: plan.method,
      baseURL: plan.baseURL,
      headers: plan.headers as unknown as undefined,
      data: (await this.body(plan)) ?? undefined,
    });

    await plan.ready?.();

    const response = (this.response = await session.request(option));
    plan.reply.code = response?.status ?? null;
    plan.reply.message = _code2message[plan.reply.code ?? 0] ?? \`unknown http code \${plan.reply.code}\`;

    try {
      const t = (plan.reply.data = response?.data);
      plan.reply.data = JSON.parse(await (t instanceof Blob ? t.text() : t));
    } catch (_) {}

    return plan.reply;
  }

  body(plan: Plan): Any {
    const type = plan.body?.type ?? null;
    const data = plan.body?.data ?? null;
    if (type === null) {
      return null;
    } else if (type === 'json') {
      return JSON.stringify(
        data instanceof Array
          ? data.map((e: Any) => (e instanceof Json2class ? _nullFilter(e.toJson()) : e))
          : data instanceof Json2class
          ? _nullFilter(data.toJson())
          : data,
      );
    } else if (type === 'map' && data instanceof Json2class) {
      return _obj2get(data.toJson());
    } else if (type === 'form' && data instanceof BodyForm) {
      const a2b = (a: BodyFormFile) => {
        if (a.file !== null) {
          return a.file;
        } else if (a.content !== null) {
          return new Blob([a.content], { type: a.contentType ?? undefined });
        }
        return null;
      };
      const map = new FormData();
      const cb = (data: Record${func.addX('string, Any')}) =>
        Object.keys(data).forEach(k => {
          ((data[k] instanceof Array ? data[k] : [data[k]]) as Array${func.addX('Any')}).forEach(e => {
            if (e instanceof BodyFormFile) {
              const t = a2b(e);
              if (t !== null) {
                if (e.filename === null) {
                  map.append(k, t);
                } else {
                  map.append(k, t, e.filename);
                }
              }
            } else if (e !== null) {
              map.append(k, e.toString());
            }
          });
        });
      cb((data as BodyForm).fields.toJson());
      cb((data as BodyForm).files.toJson());
      return map;
    } else if (data instanceof Uint8Array) {
      return data.buffer;
    } else {
      return data;
    }
  }
}`,
        };
      case DefaultAgent.Typescript_Fetch0:
        return {
          name: 'FetchAgent',
          import: '',
          code: `
export class FetchAgent extends Agent {

  session: (() => Promise${func.addX('Response')}) | null = null;
  option: RequestInit | null = null;
  response: Response | null = null;

  async fetch(plan: Plan): Promise${func.addX('Reply')} {
    let path = plan.path;
    if (plan.seg) {
      const seg = plan.seg?.toJson();
      path = path.replace(/{(.*?)}/g, (_, k: string) => seg?.[k]?.toString() ?? '');
    }
    path = \`\${plan.baseURL}\${path}\`;
    const q = _obj2get(plan.params?.toJson() ?? {});
    path = \`\${path}\${q ? (path.includes('?') ? '&' : '?') : ''}\${q}\`;

    if (plan.body?.contentType && plan.body.type !== 'form') {
      plan.headers['content-type'] = plan.body.contentType;
    }

    const option = (this.option = {
      method: plan.method,
      headers: plan.headers as unknown as undefined,
      body: (await this.body(plan)),
    });

    await plan.ready?.();

    const response = (this.response = await (this.session ? this.session() : fetch(path, option)));
    plan.reply.code = response?.status ?? null;
    plan.reply.message = _code2message[plan.reply.code ?? 0] ?? \`unknown http code \${plan.reply.code}\`;

    try {
      const rsp = response?.clone();
      plan.reply.data = await rsp?.blob();
      plan.reply.data = JSON.parse(await (plan.reply.data as Blob).text());
    } catch (_) {}

    return plan.reply;
  }

  body(plan: Plan): null | string | FormData | ArrayBufferLike {
    const type = plan.body?.type ?? null;
    const data = plan.body?.data ?? null;
    if (type === null) {
      return null;
    } else if (type === 'json') {
      return JSON.stringify(
        data instanceof Array
          ? data.map((e: Any) => (e instanceof Json2class ? _nullFilter(e.toJson()) : e))
          : data instanceof Json2class ? _nullFilter(data.toJson()) : data,
      );
    } else if (type === 'map' && data instanceof Json2class) {
      return _obj2get(data.toJson());
    } else if (type === 'form' && data instanceof BodyForm) {
      const a2b = (a: BodyFormFile) => {
        if (a.file !== null) {
          return a.file;
        } else if (a.content !== null) {
          return new Blob([a.content], { type: a.contentType ?? undefined });
        }
        return null;
      };
      const map = new FormData();
      const cb = (data: Record${func.addX('string, Any')}) =>
        Object.keys(data).forEach(k => {
          ((data[k] instanceof Array ? data[k] : [data[k]]) as Array${func.addX('Any')}).forEach(e => {
            if (e instanceof BodyFormFile) {
              const t = a2b(e);
              if (t !== null) {
                if (e.filename === null) {
                  map.append(k, t);
                } else {
                  map.append(k, t, e.filename);
                }
              }
            } else if (e !== null) {
              map.append(k, e.toString());
            }
          });
        });
      cb((data as BodyForm).fields.toJson());
      cb((data as BodyForm).files.toJson());
      return map;
    } else if (data instanceof Uint8Array) {
      return data.buffer;
    } else {
      return data as string;
    }
  }
}`,
        };
      case DefaultAgent.Typescript_Weixin3:
        return {
          name: 'FetchAgent',
          import: '',
          code: `
export class FetchAgent extends Agent {

  session: (() => Promise${func.addX('Response')}) | null = null;
  option: RequestInit | null = null;
  response: Response | null = null;

  async fetch(plan: Plan): Promise${func.addX('Reply')} {
    let path = plan.path;
    if (plan.seg) {
      const seg = plan.seg?.toJson();
      path = path.replace(/{(.*?)}/g, (_, k: string) => seg?.[k]?.toString() ?? '');
    }
    path = \`\${plan.baseURL}\${path}\`;
    const q = _obj2get(plan.params?.toJson() ?? {});
    path = \`\${path}\${q ? (path.includes('?') ? '&' : '?') : ''}\${q}\`;

    if (plan.body?.contentType && plan.body.type !== 'form') {
      plan.headers['content-type'] = plan.body.contentType;
    }

    const option = (this.option = {
      method: plan.method,
      headers: plan.headers as unknown as undefined,
      body: (await this.body(plan)),
    });

    await plan.ready?.();

    const response = (this.response = await (this.session ? this.session() : fetch(path, option)));
    plan.reply.code = response?.status ?? null;
    plan.reply.message = _code2message[plan.reply.code ?? 0] ?? \`unknown http code \${plan.reply.code}\`;

    try {
      const rsp = response?.clone();
      plan.reply.data = await rsp?.blob();
      plan.reply.data = JSON.parse(await (plan.reply.data as Blob).text());
    } catch (_) {}

    return plan.reply;
  }

  body(plan: Plan): null | string | FormData | ArrayBufferLike {
    const type = plan.body?.type ?? null;
    const data = plan.body?.data ?? null;
    if (type === null) {
      return null;
    } else if (type === 'json') {
      return JSON.stringify(
        data instanceof Array
          ? data.map((e: Any) => (e instanceof Json2class ? _nullFilter(e.toJson()) : e))
          : data instanceof Json2class ? _nullFilter(data.toJson()) : data,
      );
    } else if (type === 'map' && data instanceof Json2class) {
      return _obj2get(data.toJson());
    } else if (type === 'form' && data instanceof BodyForm) {
      const a2b = (a: BodyFormFile) => {
        if (a.file !== null) {
          return a.file;
        } else if (a.content !== null) {
          return new Blob([a.content], { type: a.contentType ?? undefined });
        }
        return null;
      };
      const map = new FormData();
      const cb = (data: Record${func.addX('string, Any')}) =>
        Object.keys(data).forEach(k => {
          ((data[k] instanceof Array ? data[k] : [data[k]]) as Array${func.addX('Any')}).forEach(e => {
            if (e instanceof BodyFormFile) {
              const t = a2b(e);
              if (t !== null) {
                if (e.filename === null) {
                  map.append(k, t);
                } else {
                  map.append(k, t, e.filename);
                }
              }
            } else if (e !== null) {
              map.append(k, e.toString());
            }
          });
        });
      cb((data as BodyForm).fields.toJson());
      cb((data as BodyForm).files.toJson());
      return map;
    } else if (data instanceof Uint8Array) {
      return data.buffer;
    } else {
      return data as string;
    }
  }
}`,
        };
      default:
        func.unreachableError('defaultAgent', [env.defaultAgent]);
        return { name: '', import: '', code: '' };
    }
  }

  static toEntry() {
    const { addX, convertWrap } = Base.func;
    const { agentConfig } = this;
    const isTs = Base.env.language.startsWith('typescript@');
    return `
${agentConfig.import}

@json2class@

function _obj2get(obj: Record${addX('string, Any')}) {
  return Object.keys(obj).reduce((v, k) => {
    obj[k] !== null && v.push(\`\${encodeURIComponent(k)}=\${encodeURIComponent(\`\${obj[k]}\`)}\`);
    return v;
  }, [] as Array${addX('string')}).join('&');
}

function _nullFilter(data: Record${addX('string, Any')}) {
  const result: Record${addX('string, Any')} = {};
  Object.entries(data).forEach((e) => {
    const key = e[0];
    const value = e[1];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nested = _nullFilter(value as Record${addX('string, Any')});
      if (Object.keys(nested).length) result[key] = nested;
    } else if (value !== null && value !== undefined) {
      result[key] = value;
    }
  });
  return result;
}

function _replyReset(reply: Reply) {
  reply.code = reply.error = reply.data = reply.exception = null;
  reply.message = '';
}

export class Reply {
  code: number | null = null;
  message = '';
  error: string | null = null;
  data: Any = null;
  exception: Any = null;
}

export abstract class Agent {
  abstract fetch(plan: Plan): Promise${addX('Reply')};
  abstract body(plan: Plan): Promise${addX('Any')} | Any;
}${agentConfig.code}

export class BodyFormFile {
  readonly content: Uint8Array | null;
  readonly file: ${isTs ? 'Blob' : 'string'} | null;
  filename: string | null = null;
  contentType: string | null = null;
  headers: Record${addX(`string, Array${addX('string')}`)} | null = null;

  private constructor(
    content: Uint8Array | null,
    file: ${isTs ? 'Blob' : 'string'} | null,
  ) {
    this.content = content === null ? null : new Uint8Array(content);
    this.file = file;
    this.contentType = 'application/octet-stream';
  }
  static fromFile(file: ${isTs ? 'Blob' : 'string'}) { return new BodyFormFile(null, file); }
  static fromString(value: string) { return new BodyFormFile(${
    isTs ? 'new TextEncoder().encode(value)' : '_Util.TextEncoder.create().encodeInto(value)'
  }, null); }
  static fromBytes(value: Array${addX('number')} | Uint8Array) { return new BodyFormFile(new Uint8Array(value), null); }
}

export class BodyForm${addX('T extends Json2class = Json2class, K extends Json2class = Json2class')} {
  fields: T;
  files: K;
  constructor(fields: T, files: K) {
    this.fields = fields;
    this.files = files;
  }
}

export class Body${addX('T')} {
  private static _types: Record${addX('string, string')} = {${Base.bodyTypes
      .map(k => `'${k}': '${(Base.contentTypes as Record<string, string>)[k]}'`)
      .join(',')}};

  readonly type: string;
  data: T;

  readonly contentType: string | null;

  constructor(type: string, data: T) {
    this.type = type;
    this.data = data;
    this.contentType = Body._types[type] ?? null;
  }
}

export class Json2httpError implements Error {
  readonly name: string;
  readonly message: string;
  readonly plan: Plan;
  constructor(plan: Plan) {
    this.plan = plan;
    this.name = plan.title;
    this.message = this.toString();
  }
  toString(): string {
    return this.plan.reply.error || this.plan.reply.message;
  }
}

export abstract class Plan {
  baseURL = '';

  abstract path: string;
  abstract seg: Json2class | null;

  abstract readonly title: string;
  abstract method: string;
  abstract res: Json2class | null;

  abstract params: Json2class | null;
  abstract body: Body${addX('Any')} | null;
  
  abstract headers: Record${addX('string, Any')};

  agent: Agent = new ${agentConfig.name}();

  reply = new Reply();

  readonly abort = (): void => {
    if (this.reply.code !== 200 && this.reply.message) {
      throw new Json2httpError(this);
    }
    if (this.reply.error) {
      throw new Json2httpError(this);
    }
  };

  readonly fetch = async (): Promise${addX('void')} => {
    _replyReset(this.reply);
    this.reply = await this.agent.fetch(this).catch((e: Any) => {
      this.reply.exception = e;
      const t = e as Record${addX('string, string')};
      this.reply.error = t['message'] || t['data'] || JSON.stringify(e);
      return this.reply;
    }).finally(async () => {
      await this.process?.(this.reply);
    });
  };

  readonly request = async (): Promise${addX('void')} => {
    await this.before?.();
    await this.fetch();
    await this.after?.();
    this.res?.fromAny(this.reply.data);
    await (this.end ?? this.abort)();
  };

  start?: () => void;
  before?: () => void;
  ready?: () => void;
  process?: (reply: Reply) => void;
  after?: () => void;
  end?: () => void;
}
@aliases@
@deps@

export class Json2http {  
  private constructor() {}
  static single = new Json2http();
  static setPlan: ((plan: Plan) => void) | null = null
@request@
}

const _code2message: Record${addX('string, string')} = JSON.parse('${convertWrap(JSON.stringify(Base.code2message))}');
`;
  }
}
