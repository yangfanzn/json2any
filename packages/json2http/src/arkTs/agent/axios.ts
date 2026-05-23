import type * as Base from '../../base';

export default function (func: Base.Func) {
  return {
    name: 'AxiosAgent',
    import: `import * as _Axios from 'axios';
import type * as _AxiosTypes from 'axios';`,
    code: `
export class AxiosAgent extends Agent {
  private static session = _Axios.default.create({ responseType: 'blob', validateStatus: () => true });

  session: _AxiosTypes.AxiosInstance | null = null;
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
}
