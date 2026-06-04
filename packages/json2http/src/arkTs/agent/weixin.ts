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
      return new TextDecoder('utf-8').decode(uint8Array);
    }
  } catch (_) {}
  let result = '';
  let i = 0;
  while (i < uint8Array.length) {
    const b = uint8Array[i] as number;
    const b1 = uint8Array[i + 1] as number;
    const b2 = uint8Array[i + 2] as number;
    const b3 = uint8Array[i + 3] as number;
    let cp: number;
    if (b < 0x80) {
      cp = b;
      i += 1;
    } else if ((b & 0xe0) === 0xc0) {
      cp = ((b & 0x1f) << 6) | (b1 & 0x3f);
      i += 2;
    } else if ((b & 0xf0) === 0xe0) {
      cp = ((b & 0x0f) << 12) | ((b1 & 0x3f) << 6) | (b2 & 0x3f);
      i += 3;
    } else {
      cp = ((b & 0x07) << 18) | ((b1 & 0x3f) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f);
      i += 4;
    }
    if (cp > 0xffff) {
      cp -= 0x10000;
      result += String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 0x3ff));
    } else {
      result += String.fromCharCode(cp);
    }
  }
  return result;
}
export function encodeUTF8(str: string) {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let cp = str.charCodeAt(i);
    if (cp >= 0xd800 && cp <= 0xdbff && i + 1 < str.length) {
      const lo = str.charCodeAt(i + 1);
      if (lo >= 0xdc00 && lo <= 0xdfff) {
        cp = ((cp - 0xd800) << 10) + (lo - 0xdc00) + 0x10000;
        i++;
      }
    }
    if (cp < 0x80) {
      bytes.push(cp);
    } else if (cp < 0x800) {
      bytes.push(0xc0 | (cp >> 6), 0x80 | (cp & 0x3f));
    } else if (cp < 0x10000) {
      bytes.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
    } else {
      bytes.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3f), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
    }
  }
  return new Uint8Array(bytes);
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
