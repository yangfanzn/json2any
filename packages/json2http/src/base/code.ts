import { Base } from 'json2class';
import { SchemaPlan } from './schema';

export abstract class Key extends Base.Key {
  abstract toArgs(): { type: string; value: string };
}

export abstract class Complex extends Base.Complex<Simple> implements Key {
  abstract toArgs(): { type: string; value: string };
}

export abstract class Simple extends Base.Simple<Complex> implements Key {
  abstract toArgs(): { type: string; value: string };
}

export abstract class Http<C extends Complex = Complex, S extends Simple = Simple> {
  json2plan(plan: C) {
    return plan.child.reduce(
      (x, cur) => {
        if (cur.optional) {
          return x;
        }

        if (cur.key === 'path') {
          if (cur instanceof plan.constructor) {
            throw '不可能 json2plan1';
          } else {
            x.path = cur as S;
            return x;
          }
        } else if (cur.key === 'title') {
          if (cur instanceof plan.constructor) {
            throw '不可能 json2plan2';
          } else {
            x.title = cur as S;
            return x;
          }
        } else if (cur.key === 'method') {
          if (cur instanceof plan.constructor) {
            throw '不可能 json2plan3';
          } else {
            x.method = cur as S;
            return x;
          }
        } else if (cur instanceof plan.constructor) {
          cur = cur as C;
        } else {
          throw '不可能 json2plan4';
        }

        switch (cur.key) {
          case 'seg':
            x.seg = cur;
            x.args.push(cur);
            break;
          case 'res':
            x.res = cur;
            x.args.push(cur);
            break;
          case 'params':
            x.params = cur;
            x.args.push(cur);
            break;
          case 'data':
            x.data = cur;
            x.args.push(cur);
            break;
          case 'form':
            x.form = cur;
            x.args.push(cur);
            break;
        }
        return x;
      },
      { args: [] as C[] } as typeof this.plan,
    );
  }

  plan: SchemaPlan<C, S>;

  protected constructor(public key: string, plan: C) {
    this.plan = this.json2plan(plan);
  }

  abstract toCode(): { context: Http; code: string; dep: Array<{ context: Complex; code: string }> };

  get nameMethod() {
    return this.key.replace(/[\/{}]/g, '');
  }
}
export interface InterHttp {}

export enum Supported {
  Dart = 'dart',
}
