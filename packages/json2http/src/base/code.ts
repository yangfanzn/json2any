import { Base } from 'json2class';
import { SchemaMeta } from './schema';

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

  plan: SchemaMeta<C, S>;

  launch: string;

  protected constructor(public key: string, plan: C) {
    this.plan = this.json2plan(plan);
    this.launch = this.key.replace(/[\/{}]/g, '');
  }

  abstract toCode(): { context: Http; code: string; dep: Array<{ context: Complex; code: string }> };
}

export enum Supported {
  Dart = 'dart',
}
