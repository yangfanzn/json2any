import { Json2classBase } from 'json2class';
import { Http } from './code';
import { SchemaTs } from './schema';

export class Func extends Json2classBase.Func {
  core2http(
    http: typeof Http<Json2classBase.Complex, Json2classBase.Simple<Json2classBase.Complex>>,
    complex: typeof Json2classBase.Complex,
    simple: typeof Json2classBase.Simple<Json2classBase.Complex>,
    key: string,
    json: SchemaTs,
  ): Http<Json2classBase.Complex, Json2classBase.Simple<Json2classBase.Complex>> {
    // 默认取 key 设置 path
    const path = json.path ?? key;

    // 从 path 中提取 url 参数
    const seg = path.match(/{.*?}/g)?.reduce((x, cur) => {
      x[cur.slice(1, -1)] = '';
      return x;
    }, {} as Record<string, string>);

    // body.type 缺失 json
    if (json?.body && !json?.body.type) {
      json.body.type = 'json';
    }

    // @ts-ignore
    return new http(
      key,
      this.core2class(complex as typeof Json2classBase.Complex, simple as typeof Json2classBase.Simple, '', {
        ...json,
        res: json.res,
        path,
        [`seg${seg ? '' : '?'}`]: seg ?? {},
        [`params${json.params ? '' : '?'}`]: json.params ?? {},
        [`body${json.body ? '' : '?'}`]: json.body ?? {},
      }),
    );
  }

  isBodyFiles(self: Json2classBase.Key) {
    if (self instanceof Json2classBase.Simple) {
      return (
        self.parent?.parent?.parent?.parent &&
        self.parent.key === 'files' &&
        self.parent.parent.key === 'data' &&
        self.parent.parent.parent.key === 'body' &&
        !self.parent.parent?.parent?.parent?.parent
      );
    } else {
      return (
        self.parent?.parent?.parent &&
        self.key === 'files' &&
        self.parent.key === 'data' &&
        self.parent.parent.key === 'body' &&
        !self.parent?.parent?.parent?.parent
      );
    }
  }
}

export const func = new Func();
