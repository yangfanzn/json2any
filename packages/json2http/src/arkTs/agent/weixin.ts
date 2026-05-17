import type * as Base from '../../base';

export default function (func: Base.Func) {
  return {
    name: 'WeixinAgent',
    import: '',
    code: `
export class FormData {
  private _data: [string, string | BodyFormFile][] = [];
  constructor() {}
  append(name: string, value: string | BodyFormFile): void {
    this._data.push([name, value]);
  }
  async toBuffer(): Promise<{ buffer: ArrayBuffer; contentType: string }> {
    const buffers: ArrayBuffer[] = [];
    const CRLF = '\\r\\n';
    const pushText = (text: string) => buffers.push(encodeUTF8(text));
    const boundary = '----yangfanznBoundary' + Math.random().toString(36).substring(2, 14);
    for (const [name, value] of this._data) {
      pushText(\`--\${boundary}\${CRLF}\`);
      if (typeof value === 'string') {
        pushText(\`Content-Disposition: form-data; name="\${name}"\${CRLF}\${CRLF}\`);
        pushText(\`\${value}\${CRLF}\`);
      } else if (value instanceof BodyFormFile) {
        pushText(\`Content-Disposition: form-data; name="\${name}";\${value.filename === null ? '' : \` filename="\${value.filename}"\`}\${CRLF}\`);
        pushText(\`Content-Type: \${value.contentType}\${CRLF}\${CRLF}\`);
        if (value.file !== null) {
          buffers.push((await new Promise<{ data: ArrayBuffer | string }>((resolve, reject) => {
            wx.getFileSystemManager().readFile({
              filePath: value.file as string,
              success: resolve,
              fail: reject,
            })
          })).data as ArrayBuffer);      
        } else if (value.content !== null) {
          buffers.push(value.content);
        }
        pushText(CRLF);
      }
    }
    pushText(\`--\${boundary}--\${CRLF}\`);
    const totalLength = buffers.reduce((sum, buf) => sum + buf.byteLength, 0);
    const resultView = new Uint8Array(totalLength);
    let offset = 0;
    for (const buf of buffers) {
      resultView.set(new Uint8Array(buf), offset);
      offset += buf.byteLength;
    }
    return {
      contentType: \`multipart/form-data; boundary=\${boundary}\`,
      buffer: resultView.buffer,
    };
  }
}
export function decodeUTF8(uint8Array: Uint8Array) {
  try {
    // @ts-ignore
    if (typeof TextDecoder !== 'undefined') {
      // @ts-ignore
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(uint8Array);
    }
  } catch (_) {}
  let binary = '';
  const len = uint8Array.length;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  try {
    return decodeURIComponent(escape(binary));
  } catch (_) {
    return binary;
  }
}
export function encodeUTF8(str: string) {
  const encoded = encodeURIComponent(str);
  const len = encoded.length;
  const bytes = new Array(len);
  let writeIdx = 0;
  for (let i = 0; i < len; i++) {
    const c = encoded[i];
    if (c === '%') {
      const high = encoded.charCodeAt(i + 1);
      const low = encoded.charCodeAt(i + 2);
      bytes[writeIdx++] = (high - (high > 64 ? 55 : 48)) * 16 + (low - (low > 64 ? 55 : 48));
      i += 2;
    } else {
      bytes[writeIdx++] = c.charCodeAt(0);
    }
  }
  return new Uint8Array(bytes.slice(0, writeIdx));
}
export interface Response {
  success?: WechatMiniprogram.RequestSuccessCallbackResult;
  fail?: WechatMiniprogram.GeneralCallbackResult;
  task?: WechatMiniprogram.RequestTask;
}
export class WeixinAgent extends Agent {

  session: (() => Promise${func.addX('WechatMiniprogram.RequestTask')}) | null = null;
  option: WechatMiniprogram.RequestOption | null = null;
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

    const response: Response = {};

    let body = await this.body(plan);
    if (body instanceof FormData) {
      const { buffer, contentType } = await body.toBuffer();
      plan.headers['content-type'] = contentType;
      body = buffer;
    }
    const option: WechatMiniprogram.RequestOption = (this.option = {
      url: path,
      method: plan.method as 'GET',
      header: Object.keys(plan.headers).reduce((a, k) => ({ ...a, [k]: plan.headers?.[k]?.toString() ?? '' }), {}),
      responseType: 'arraybuffer',
      data: body as string,
    });

    await plan.ready?.();

    await new Promise(async (resolve, reject) => {
      const callback = (res: WechatMiniprogram.RequestSuccessCallbackResult | WechatMiniprogram.GeneralCallbackResult) => {
        if ('statusCode' in res) {
          response.success = res;
          resolve(undefined);
        } else {
          response.fail = res;
          reject(res);
        }
      }

      option.success = callback;
      option.fail = callback;

      response.task = await (this.session ? this.session() : wx.request(option));
      this.response = response;
    });

    plan.reply.code = this.response?.success?.statusCode ?? null;
    plan.reply.message = _code2message[plan.reply.code ?? 0] ?? \`unknown http code \${plan.reply.code}\`;

    try {
      plan.reply.data = this.response?.success?.data ?? null;
      plan.reply.data = JSON.parse(decodeUTF8(new Uint8Array(plan.reply.data as ArrayBuffer)));
    } catch (_) {}

    return plan.reply;
  }

  body(plan: Plan): null | string | FormData | ArrayBufferLike {
    const type = plan.body?.type ?? null;
    const data = plan.body?.data ?? null;
    if (type === 'json') {
      return JSON.stringify(
        data instanceof Array
          ? data.map((e: Any) => (e instanceof Json2class ? _nullFilter(e.toJson()) : e))
          : data instanceof Json2class ? _nullFilter(data.toJson()) : data,
      );
    } else if (type === null || data === null) {
      return undefined as any as null;
    } else if (type === 'map' && data instanceof Json2class) {
      return _obj2get(data.toJson());
    } else if (type === 'form' && data instanceof BodyForm) {
      const map = new FormData();
      const cb = (data: Record${func.addX('string, Any')}) =>
        Object.keys(data).forEach(k => {
          ((data[k] instanceof Array ? data[k] : [data[k]]) as Array${func.addX('Any')}).forEach(e => {
            if (e instanceof BodyFormFile) {
              map.append(k, e);
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
}
