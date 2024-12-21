import { Base } from 'json2class';
import { SchemaPlan, SchemaBody } from './schema';

export abstract class Key extends Base.Key {}

export abstract class Complex extends Base.Complex<Simple> implements Key {}

export abstract class Simple extends Base.Simple<Complex> implements Key {}

export abstract class Http<C extends Complex = Complex, S extends Simple = Simple> {
  json2plan(plan: C) {
    return plan.child.reduce((x, cur) => {
      if (cur.optional) {
        return x;
      }

      if (cur instanceof plan.constructor) {
        cur = cur as C;
        switch (cur.key) {
          case 'seg':
            x.seg = cur;
            break;
          case 'res':
            x.res = cur;
            break;
          case 'params':
            x.params = cur;
            break;
          case 'body':
            x.body = cur;
            break;
          default:
            throw '不可能 json2plan1';
        }
      } else {
        cur = cur as S;
        switch (cur.key) {
          case 'path':
            x.path = cur as S;
            break;
          case 'title':
            x.title = cur as S;
            break;
          case 'method':
            x.method = cur as S;
            break;
          default:
            throw '不可能 json2plan2';
        }
      }

      return x;
    }, {} as typeof this.plan);
  }

  plan: SchemaPlan<C, S>;

  launch: string;

  protected constructor(public key: string, plan: C) {
    this.plan = this.json2plan(plan);
    this.launch = this.key.replace(/[\/{}]/g, '');
    this.plan.title.parent.key = this.launch;
  }

  abstract toLaunch(body?: SchemaBody): string;

  toCode() {
    const { plan } = this;
    let body: SchemaBody | undefined;
    if (plan.body) {
      const type = plan.body.getChildByKey('type')?.origin;
      const data = plan.body.getChildByKey('data');
      if (!type) {
        throw '不可能发生';
      }
      body = { type, data };
    }
    return {
      context: this as typeof this,
      code: this.toLaunch(body),
      dep: [plan.res, plan.seg, plan.params, body?.data].reduce((codes, cur) => {
        if (!(cur instanceof Base.Complex)) {
          return codes;
        }
        codes.push(...cur.toCode());
        return codes;
      }, [] as { context: Complex; code: string }[]),
    };
  }
}

export enum Supported {
  Dart = 'dart',
}
