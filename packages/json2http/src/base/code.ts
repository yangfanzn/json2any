import { Base } from 'json2class';
import { SchemaTs } from './schema';

export interface InterKey extends Base.Key {}

export abstract class Http {
  json2plan(plan: Base.Complex) {
    return plan.child.reduce<typeof this.plan>(
      (x, cur) => {
        if (cur.optional) {
          return x;
        }

        if (cur.key === 'title') {
          if (cur instanceof Base.Simple) {
            x.title = cur;
            return x;
          } else {
            throw '不可能 json2plan1';
          }
        } else if (cur.key === 'method') {
          if (cur instanceof Base.Simple) {
            x.method = cur;
            return x;
          } else {
            throw '不可能 json2plan2';
          }
        }

        if (!(cur instanceof Base.Complex)) {
          throw '不可能 json2plan3';
        }
        switch (cur.key) {
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
      { args: [], method: undefined as any, title: undefined as any },
    );
  }

  plan: {
    params?: Base.Complex;
    data?: Base.Complex;
    form?: Base.Complex;
    args: Base.Complex[];
    title: Base.Simple;
    method: Base.Simple;
  };

  protected constructor(public key: string, plan: Base.Complex) {
    this.plan = this.json2plan(plan);
  }

  abstract toCode(): { context: Http; code: string };

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
