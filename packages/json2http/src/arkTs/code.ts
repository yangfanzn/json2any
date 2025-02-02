import { Json2classArkTs } from 'json2class';
import * as Base from '../base';

export class Complex extends Json2classArkTs.Complex {}

export class Simple extends Json2classArkTs.Simple {}

export class Http extends Base.Http<Complex, Simple> {
  toLaunch(plan: Base.SchemaPlan) {
    const { addX } = Base.func;

    const { body } = plan;

    let bodyDef = 'null';
    if (body) {
      if (body.type === 'form') {
        bodyDef = `new Body('${body.type}', new BodyForm(${body.data.fields.def}, ${body.data.files.def}))`;
      } else if (body.data?.array.length) {
        bodyDef = `new Body('${body.type}', [] as ${plan.title.lang.arrayType(body.data.array, body.data.decl)})`;
      } else if (body.type === 'plain') {
        bodyDef = `new Body('${body.type}', '')`;
      } else if (body.type === 'byte') {
        bodyDef = `new Body('${body.type}', new Uint8Array(0))`;
      } else if (body.data) {
        bodyDef = `new Body('${body.type}', ${body.data.def})`;
      } else {
        Base.func.unreachableError(`[${plan.path.origin}] unknown body type parsing`);
      }
    }

    const types = [
      `path = '${plan.path.origin}'`,
      `seg = ${plan.seg?.def ?? 'null'}`,
      `title = '${plan.title.origin}'`,
      `method = '${plan.method.origin}'`,
      `res = ${plan.res?.def ?? 'null'}`,
      `params = ${plan.params?.def ?? 'null'}`,
      `body = ${bodyDef}`,
      `headers: Record${addX('string, Any')} = JSON.parse('${Base.func.convertWrap(
        JSON.stringify(plan.headers?.origin ?? {}),
      )}')`,
    ].join('; ');

    return {
      code: `
async ${this.launch}(setPlan: (plan: ${this.declPlan}) => void): Promise${addX(this.declPlan)}  {
  const plan = new ${this.declPlan}();
  await Json2http.setPlan?.(plan);
  await setPlan(plan);
  await (plan.start ?? plan.request)();
  return plan;
}`,
      plan: `
export class ${this.declPlan} extends Plan { ${types} }`,
    };
  }

  static get agentConfig() {
    const { addX } = Base.func;
    if (Base.env.extend.agent) {
      // todo: 未实现
      return {
        name: `Extend.${Base.env.extend.agent}`,
        import: `import '${Base.env.extend.path}' as Extend;`,
        response: 'Object',
        exception: 'Object',
        code: '',
      };
    }
    return {
      name: 'RcpAgent',
      import: `import { rcp } from '@kit.RemoteCommunicationKit';
import { BusinessError } from '@kit.BasicServicesKit';
import url from '@ohos.url';`,
      response: 'rcp.Response',
      exception: 'BusinessError',
      code: `
export class RcpAgent extends Agent {
  private static session = rcp.createSession();
  
  session: rcp.Session | null = null;
  // ready is the only hook where option can be set
  option: rcp.Request | null = null;

  async fetch(plan: Plan): Promise${addX('Reply')}  {
    const session = this.session ?? RcpAgent.session;
  
    let path = plan.path;
    if (plan.seg) {
      const seg = plan.seg?.toJson();
      path = path.replace(/{(.*?)}/g, (_, k: string) => seg?.[k]?.toString() ?? '');
    }
    
    const uri = url.URL.parseURL(plan.path, plan.baseURL);
    uri.search = (new url.URLParams((plan.params?.toJson() ?? {}) as Record${addX('string, string')})).toString();
    if (plan.body?.contentType) {
      plan.headers['content-type'] = plan.body.contentType;
    }
    const option = this.option = new rcp.Request(uri.toString(),
      plan.method,
      plan.headers as rcp.RequestHeaders,
      await this.body(plan) ?? undefined
    );

    await plan.ready?.();

    try {
      plan.reply.response = await session.fetch(option).finally(() => this.session?.close());
    } catch (e) {
      plan.reply.exception = e;
    }

    const response = plan.reply.response;
    plan.reply.code = response?.statusCode ?? null;
    plan.reply.message = code2message[plan.reply.code ?? 0];
    plan.reply.error = plan.reply.exception?.message ?? null;

    try {
      plan.reply.data = response?.toJSON() ?? null;
    } catch (e) {
      plan.reply.data = response?.body ?? null;
    }

    await plan.process?.(plan.reply);

    return plan.reply;
  }

  body(plan: Plan): Any {
    const type = plan.body?.type ?? null;
    const data = plan.body?.data ?? null;
    if (type == null) {
      return null;
    } else if (type == 'json') {
      return JSON.stringify(data);
    } else if (type == 'map' && data instanceof Json2class) {
      return data.toJson();
    } else if (type == 'form' && data instanceof BodyForm) {
      const t: rcp.MultipartFormFields = {};
      const fields = (data as BodyForm).fields.toJson();
      const files = (data as BodyForm).files.toJson();
      Object.keys(fields).forEach(k => t[k] = fields[k] as rcp.MultipartFormFieldValue);
      Object.keys(files).forEach(k => t[k] = files[k] as rcp.MultipartFormFieldValue);
      return new rcp.MultipartForm(t);
    } else {
      return data;
    }
  }
}`,
    };
  }

  static toEntry() {
    const { addX } = Base.func;
    const { agentConfig } = this;
    return `
${agentConfig.import}

@json2class@
export class Reply {
  code: number | null = null;
  message: string | null = null;
  error: string | null = null;
  data: Any = null;
  response: ${agentConfig.response} | null = null;
  exception: ${agentConfig.exception} | null = null;
}
export abstract class Agent {
  abstract fetch(plan: Plan): Promise${addX('Reply')};
  abstract body(plan: Plan): Promise${addX('Any')} | Any;
}${agentConfig.code}
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
    return this.plan.reply.error ?? this.plan.reply.message ?? 'unknown';
  }
}

export abstract class Plan {
  baseURL = '';

  abstract path: string;
  abstract seg: Json2class | null;

  abstract title: string;
  abstract method: string;
  abstract res: Json2class | null;

  abstract params: Json2class | null;
  abstract body: Body${addX('Any')} | null;
  
  abstract headers: Record${addX('string, Any')};

  agent = new ${agentConfig.name}();

  reply = new Reply();

  abort() {
    if (this.reply.code !== 200 && !this.reply.message) {
      throw new Json2httpError(this);
    }
    if (!this.reply.error) {
      throw new Json2httpError(this);
    }
  }
  
  async request(): Promise${addX('void')} {
    await this.before?.();
    this.reply = await this.agent.fetch(this);
    await this.after?.();
    this.res?.fromAny(this.reply.data);
    await (this.end ?? this.abort)();
  }

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

const code2message: Record${addX('string, string')} = JSON.parse('${Base.func.convertWrap(
      JSON.stringify(Base.code2message),
    )}');
`;
  }
}
