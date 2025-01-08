import { Json2classDart, Json2classBase } from 'json2class';
import * as Base from '../base';

export class Complex extends Json2classDart.Complex {}

export class Simple extends Json2classDart.Simple {}

export class Http extends Base.Http<Complex, Simple> {
  toLaunch(body?: Base.SchemaBody) {
    const { addX } = Json2classBase.func;
    const { plan } = this;
    const { lang } = plan.title.parent;

    let bodyDecl = 'Null';
    let bodyDef = 'null';

    if (body) {
      if (body.type === 'form') {
        bodyDecl = `Body${addX(`BodyForm${addX(`${body.data.fields.decl}, ${body.data.files.decl}`)}`)}`;
        bodyDef = `Body(type: '${body.type}', data: BodyForm(fields: ${body.data.fields.def}, files: ${body.data.files.def}))`;
      } else if (body.data?.array.length) {
        bodyDecl = lang.arrayType(body.data.array, body.data.decl);
        bodyDef = `Body(type: '${body.type}', data: ${bodyDecl}.empty())`;
        bodyDecl = `Body${addX(bodyDecl)}`;
      } else if (body.type === 'byte') {
        bodyDecl = `Body${addX('Uint8List')}`;
        bodyDef = `Body(type: '${body.type}', data: Uint8List(0))`;
      } else if (body.data) {
        bodyDecl = `Body${addX(body.data.decl)}`;
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
Future${addX(this.declPlan)} ${this.launch}(FutureOr${addX('void')} Function(${this.declPlan} plan) _) async {
  var plan = Plan(${args});
  await option(plan);
  await _(plan);
  return plan.request(plan);
}`,
      alias: `typedef ${this.declPlan} = Plan${addX(types)};`,
    };
  }

  static get executorConfig() {
    if (this.env.extend.executor) {
      return {
        name: `Extend.${this.env.extend.executor}`,
        import: `import '${this.env.extend.path}' as Extend;`,
        code: '',
      };
    }
    return {
      name: 'DioExecutor',
      import: "import 'package:dio/dio.dart' as Dio;",
      code: `
class DioExecutor extends Executor {
  Dio.Dio dio = Dio.Dio();
  Dio.Options options = Dio.Options(
    validateStatus: (e) => true,
    receiveDataWhenStatusError: true,
    responseType: Dio.ResponseType.plain,
  );
  FutureOr${Json2classBase.func.addX('Answer')} request(Plan plan) async {
    var path = plan.path;
    if (plan.seg != null) {
      var seg = plan.seg?.toJson();
      path = path.replaceAllMapped(new RegExp('{(.*?)}'), (match) => seg?[match.group(1)] ?? '');
    }
    var origin = await dio.request(
      '\${plan.baseURL}\${path}',
      queryParameters: plan.params?.toJson(),
      data: await bodyEncode(plan),
      options: options
        ..method = plan.method
        ..contentType = plan.body?.contentType,
    );
    plan.answer.origin = origin;
    plan.answer.code = origin.statusCode ?? 0;
    plan.answer.message = origin.statusMessage ?? '';
    plan.answer.data = origin.data;
    return plan.answer;
  }

  dynamic bodyEncode(Plan plan) {
    var type = plan.body?.type;
    var data = plan.body?.data;
    if (type == null) {
      return null;
    } else if (type == 'json') {
      return Convert.jsonEncode(data);
    } else if (type == 'map' && data is Cls) {
      return data.toJson();
    } else if (type == 'form' && data is BodyForm) {
      return Dio.FormData.fromMap({ ...data.fields.toJson(), ...data.files.toJson() });
    } else {
      return data;
    }
  }
}  
`,
    };
  }

  static toEntry() {
    const { addX } = Json2classBase.func;
    const { executorConfig } = this;
    return `
import 'dart:async';
import 'dart:typed_data';
${executorConfig.import}

@cls@

class Answer {
  int code = 0;
  String message = '';
  String error = '';
  dynamic data;
  dynamic origin;
}

abstract class Executor {
  FutureOr${addX('Answer')} request(Plan plan);
  dynamic bodyEncode(Plan plan);
}

${executorConfig.code}

class BodyForm${addX('T extends Cls, K extends Cls')} {
  T fields;
  K files;
  BodyForm({
    required this.fields,
    required this.files,
  });
}

class Body${addX('T')} {
  static Map${addX('String, String')} _types = {${Object.keys(Base.contentTypes)
      .map(k => `'${k}': '${(Base.contentTypes as Record<string, { header: string }>)[k]?.header}'`)
      .join(',')}};

  final String type;
  T data;

  final String? contentType;

  Body({
    required this.type,
    required this.data,
  }) : contentType = _types[type];
}

class Plan${addX('R extends Cls, S extends Cls?, P extends Cls?, B extends Body?')} {
  String baseURL = '';
  R res;

  String path;
  S seg;

  String title;
  String method;

  P params;
  B body;

  Plan({
    required this.path,
    required this.seg,
    required this.title,
    required this.method,
    required this.res,
    required this.params,
    required this.body,
  });

  ${executorConfig.name} executor = ${executorConfig.name}();

  Answer answer = Answer();

  FutureOr${addX('Answer')} Function(Plan) transform = (Plan plan) {
    var data = '\${plan.answer.data}';
    if (!RegExp('"statusCode":"0"').hasMatch(data)) {
      return plan.answer..error = data;
    }
    return plan.answer;
  };

  FutureOr${addX('Plan<R, S, P, B>')} Function(Plan${addX('R, S, P, B')} plan) request = (Plan${addX(
      'R, S, P, B',
    )} plan) async {
    plan.answer = await plan.executor.request(plan);
    plan.answer = await plan.transform(plan);
    plan.res.fromAny(plan.answer.data);
    if (plan.answer.code != 200) {
      throw plan.answer.message;
    }
    if (plan.answer.error.isNotEmpty) {
      throw plan.answer.error;
    }
    return plan;
  };
}

@aliases@

@deps@

class Json2http {
  Json2http._();
  static Json2http single = Json2http._();
  static FutureOr${addX('void')} Function(Plan plan) option = (Plan plan) {};

@request@

}

`;
  }
}
