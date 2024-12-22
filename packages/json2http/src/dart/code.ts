import { Dart } from 'json2class';
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
        bodyDecl = `Body<${bodyDecl}>`;
      } else if (body.data) {
        bodyDecl = `Body<${body.data.decl}>`;
        bodyDef = `Body(type: '${body.type}', data: ${body.data.def})`;
      } else if (body.type === 'binary') {
        bodyDecl = 'Body<TypedData.Uint8List>';
        bodyDef = `Body(type: '${body.type}', data: TypedData.Uint8List(0))`;
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

    return `
Future<Plan<${types}>> ${this.launch}(Future<void> Function(Plan<${types}> plan) _) async {
  var plan = Plan(${args});
  await _(plan);
  return plan.request(plan);
}`;
  }
}
