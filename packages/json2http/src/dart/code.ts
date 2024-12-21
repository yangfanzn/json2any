import { Dart } from 'json2class';
import { Http as _Http, Complex as _Complex, Simple as _Simple } from '../base';

export class Complex extends Dart.Complex<Simple> implements _Complex {}

export class Simple extends Dart.Simple<Complex> implements _Simple {}

export class Http extends _Http<Complex, Simple> {
  toCode() {
    const { plan } = this;

    plan.title.parent.key = this.launch;

    let body: { type: string; data?: Complex | Simple } | undefined;
    if (plan.body) {
      const type = plan.body.getChildByKey('type')?.origin;
      const data = plan.body.getChildByKey('data');
      if (!type) {
        throw '不可能发生';
      }
      body = { type, data };
    }

    const types = [
      plan.res.decl,
      plan.seg ? plan.seg.decl : 'Null',
      plan.params ? plan.params.decl : 'Null',
      body?.type ? `Body<${body.data?.decl ?? 'Null'}>` : 'Null',
    ].join(', ');

    const args = [
      `res: ${plan.res.def}`,
      `path: '${plan.path.origin}'`,
      `seg: ${plan.seg ? plan.seg.def : 'null'}`,
      `title: '${plan.title.origin}'`,
      `method: '${plan.method.origin}'`,
      `params: ${plan.params ? plan.params.def : 'null'}`,
      `body: ${body?.type ? `Body(type: '${body.type}', data: ${body?.data ? body.data.def : 'null'})` : 'null'}`,
    ].join(', ');

    // todo: types 和 args 循环逻辑可以放到基类
    return {
      context: this as Http,
      code: `
Future<Plan<${types}>> ${this.launch}(Future<void> Function(Plan<${types}> plan) _) async {
  var plan = Plan(${args});
  await _(plan);
  return plan.request(plan);
}`,
      dep: [plan.res, plan.seg, plan.params, body?.data].reduce((codes, cur) => {
        if (!(cur instanceof Complex)) {
          return codes;
        }
        codes.push(...cur.toCode());
        return codes;
      }, [] as { context: Complex; code: string }[]),
    };
  }
}
