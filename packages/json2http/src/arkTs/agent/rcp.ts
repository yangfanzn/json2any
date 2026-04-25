import type * as Base from '../../base';

export default function (func: Base.Func) {
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
}
