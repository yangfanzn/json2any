import { Dart } from 'json2class';
import { Http as _Http, Complex as _Complex, Simple as _Simple } from '../base';

export class Complex extends Dart.Complex<Simple> implements _Complex {
  toArgs() {
    return { type: this.nameClass, value: `${this.nameClass}()` };
  }
}

export class Simple extends Dart.Simple<Complex> implements _Simple {
  toArgs() {
    return this.toDefVal(this.type);
  }
}

export class Http extends _Http<Complex, Simple> {
  toCode() {
    const { plan } = this;

    plan.title.parent.key = this.nameMethod;

    const types = [
      plan.res.toArgs().type,
      plan.params ? plan.params.toArgs().type : 'Null',
      plan.data ? plan.data.toArgs().type : 'Null',
      plan.form ? plan.form.toArgs().type : 'Null',
    ].join(', ');

    const args = [
      `path: '${plan.path.origin}'`,
      `title: '${plan.title.origin}'`,
      `method: '${plan.method.origin}'`,
      `res: ${plan.res.toArgs().value}`,
      `params: ${plan.params ? plan.params.toArgs().value : 'null'}`,
      `data: ${plan.data ? plan.data.toArgs().value : 'null'}`,
      `form: ${plan.form ? plan.form.toArgs().value : 'null'}`,
    ].join(', ');

    // todo: types 和 args 循环逻辑可以放到基类
    return {
      context: this as Http,
      code: `
Future<Plan<${types}>> ${this.nameMethod}(Future<void> Function(Plan<${types}> plan) _) async {
  var plan = Plan(${args});
  await _(plan);
  return plan.request(plan) as Future<Plan<${types}>>;
}`,
      dep: plan.args.reduce((codes, cur) => {
        codes.push(...cur.toCode());
        return codes;
      }, [] as { context: Complex; code: string }[]),
    };
  }
}
