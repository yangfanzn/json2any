import { Base } from 'json2class';
import { Http, Complex, Simple, SchemaTs } from '.';

export class Func extends Base.Func {
  core2http(
    http: typeof Http<Complex, Simple>,
    complex: typeof Complex,
    simple: typeof Simple,
    key: string,
    json: SchemaTs,
  ): Http {
    // @ts-ignore
    return new http(
      key,
      Base.func.core2class(complex as typeof Base.Complex, simple as typeof Base.Simple, '', {
        ...json,
        path: json.path ?? key,
        res: json.res,
        [`params${json.params ? '' : '?'}`]: json.params ?? {},
        [`data${json.data ? '' : '?'}`]: json.data ?? {},
        [`form${json.form ? '' : '?'}`]: json.form ?? {},
      }),
    );
  }
}

export const func = new Func();
