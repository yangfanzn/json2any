import { Dart, Base } from 'json2class';
import { Http as _Http, Complex as _Complex, Simple as _Simple, SchemaBody } from '../base';

export class Complex extends Dart.Complex<Simple> implements _Complex {}

export class Simple extends Dart.Simple<Complex> implements _Simple {}

export class Http extends _Http<Complex, Simple> {
  toLaunch(body?: SchemaBody) {
    const { plan } = this;

    let bodyDecl = 'Null';
    let bodyDef = 'null';

    if (body) {
      if (body.data?.array.length) {
        bodyDecl = Dart.func.arrayType(body.data.array, body.data.decl);
        bodyDef = `Body(type: '${body.type}', data: ${bodyDecl}.empty())`;
        bodyDecl = `Body${Base.Func.addX(bodyDecl)}`;
      } else if (body.type === 'form') {
        // let fields: Complex | Simple | undefined;
        // if (body.data instanceof Complex) {
        //   fields = body.data.getChildByKey('fields');
        //   if (!(fields instanceof Complex)) {
        //     fields = undefined;
        //   }
        // }
        // if (!fields) {
        //   throw '不可能发生';
        // }
        bodyDecl = `Body${Base.Func.addX(`BodyForm${Base.Func.addX(body.data.decl)}`)}`;
        bodyDef = `Body(type: '${body.type}', data: BodyForm(fields: ${body.data.def}))`;
      } else if (body.type === 'byte') {
        bodyDecl = `Body${Base.Func.addX('TypedData.Uint8List')}`;
        bodyDef = `Body(type: '${body.type}', data: TypedData.Uint8List(0))`;
      } else if (body.data) {
        bodyDecl = `Body${Base.Func.addX(body.data.decl)}`;
        bodyDef = `Body(type: '${body.type}', data: ${body.data.def})`;
      } else {
        bodyDef = `Body(type: '${body.type}', data: null)`;
      }
    }

    const types = [
      plan.res.decl,
      plan.seg ? plan.seg.decl : 'Null',
      plan.params ? plan.params.decl : 'Null',
      bodyDecl,
    ].join(', ');

    const args = [
      `res: ${plan.res.def}`,
      `path: '${plan.path.origin}'`,
      `seg: ${plan.seg ? plan.seg.def : 'null'}`,
      `title: '${plan.title.origin}'`,
      `method: '${plan.method.origin}'`,
      `params: ${plan.params ? plan.params.def : 'null'}`,
      `body: ${bodyDef}`,
    ].join(', ');

    return {
      code: `
Future${Base.Func.addX(this.declPlan)} ${this.launch}(Future${Base.Func.addX('void')} Function(${
        this.declPlan
      } plan) _) async {
  var plan = Plan(${args});
  await option(plan);
  await _(plan);
  return plan.request(plan);
}`,
      type: `typedef ${this.declPlan} = Plan${Base.Func.addX(types)};`,
    };
  }
}
