import { Base } from 'json2class';
import { Http, Complex, Simple, SchemaTs } from '.';

export abstract class Func {
  core2http(
    http: typeof Http<Complex, Simple>,
    complex: typeof Complex,
    simple: typeof Simple,
    key: string,
    json: SchemaTs,
  ): Http {
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
      Base.Func.core2class(complex as typeof Base.Complex, simple as typeof Base.Simple, '', {
        ...json,
        res: json.res,
        path,
        [`seg${seg ? '' : '?'}`]: seg ?? {},
        [`params${json.params ? '' : '?'}`]: json.params ?? {},
        [`body${json.body ? '' : '?'}`]: json.body ?? {},
      }),
    );
  }
}
