import { Base } from 'json2class';
import { SchemaTs } from './schema';

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

        if (cur.key === 'title') {
          if (cur instanceof plan.constructor) {
            throw '不可能 json2plan1';
          } else {
            x.title = cur as S;
            return x;
          }
        } else if (cur.key === 'method') {
          if (cur instanceof plan.constructor) {
            throw '不可能 json2plan2';
          } else {
            x.method = cur as S;
            return x;
          }
        }

        switch (cur.key) {
          case 'params':
            if (cur instanceof plan.constructor) {
              x.params = cur as C;
              x.args.push(cur as C);
            } else {
              throw '不可能 json2plan3';
            }
            break;
          case 'data':
            x.data = cur as S;
            x.args.push(cur as S);
            break;
          case 'form':
            if (cur instanceof plan.constructor) {
              x.form = cur as C;
              x.args.push(cur as C);
            } else {
              throw '不可能 json2plan4';
            }
            break;
        }
        return x;
      },
      { args: [] as (C | S)[] } as typeof this.plan,
    );
  }

  plan: {
    params?: C;
    data?: C | S;
    form?: C;
    args: (C | S)[];
    title: S;
    method: S;
  };

  protected constructor(public key: string, plan: C) {
    this.plan = this.json2plan(plan);
  }

  abstract toCode(): { context: Http; code: string; dep: Array<{ context: Complex; code: string }> };

  get nameMethod() {
    return this.key.replace(/\//g, '');
  }
}
export interface InterHttp {
  toFiles(jsons: Map<string, SchemaTs>, type?: Supported): Map<string, string>;
}

export enum Supported {
  Dart = 'dart',
}
