import { Dart } from 'json2class';
import { Http as _Http, InterKey } from '../base';

export class Complex extends Dart.Complex implements InterKey {}

export class Simple extends Dart.Simple implements InterKey {}

export class Http extends _Http {
  toCode(): { context: Http; code: string } {
    const { plan } = this;
    plan.title.parent.key = this.nameMethod;
    const types = [
      plan.params ? plan.params.nameClass : 'Null',
      plan.data ? plan.data.nameClass : 'Null',
      this.plan.form ? this.plan.form.nameClass : 'Null',
    ].join(', ');

    const args = [
      `title: '${plan.title.origin}'`,
      `method: Method.Post`,
      `params: ${plan.params ? `${plan.params.nameClass}()` : 'null'}`,
      `data: ${plan.data ? `${plan.data.nameClass}()` : 'null'}`,
      `form: ${plan.form ? `${plan.form.nameClass}()` : 'null'}`,
    ].join(', ');

    return {
      context: this,
      code: this.plan.args
        .reduce(
          (codes, cur) => {
            codes.push(...cur.toCode().map(e => e.code));
            return codes;
          },
          [
            `${this.nameMethod}(void Function(Plan<${types}> plan) _) {
  _(Plan(${args}));
}`,
          ],
        )
        .join('\n'),
    };
  }
}
