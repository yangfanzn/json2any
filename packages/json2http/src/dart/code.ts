import { Json2classDart, Json2classBase } from 'json2class';
import * as Base from '../base';

export class Complex extends Json2classDart.Complex {}

export class Simple extends Json2classDart.Simple {}

export class Http extends Base.Http<Complex, Simple> {
  toLaunch(plan: Base.SchemaPlan) {
    const { addX } = Json2classBase.func;

    const { body } = plan;

    let bodyDecl = 'Null';
    let bodyDef = 'null';

    if (body) {
      if (body.type === 'form') {
        bodyDecl = `Body${addX(`BodyForm${addX(`${body.data.fields.decl}, ${body.data.files.decl}`)}`)}`;
        bodyDef = `Body(type: '${body.type}', data: BodyForm(fields: ${body.data.fields.def}, files: ${body.data.files.def}))`;
      } else if (body.data?.array.length) {
        bodyDecl = plan.title.lang.arrayType(body.data.array, body.data.decl);
        bodyDef = `Body(type: '${body.type}', data: ${bodyDecl}.empty())`;
        bodyDecl = `Body${addX(bodyDecl)}`;
      } else if (body.type === 'plain') {
        bodyDecl = `Body${addX('String')}`;
        bodyDef = `Body(type: '${body.type}', data: '')`;
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

  static get agentConfig() {
    if (Base.env.extend.agent) {
      return {
        name: `Extend.${Base.env.extend.agent}`,
        import: `import '${Base.env.extend.path}' as Extend;`,
        code: '',
      };
    }
    return {
      name: 'DioAgent',
      import: "import 'package:dio/dio.dart' as Dio;",
      code: `
class DioAgent extends Agent {
  Dio.Dio dio = Dio.Dio();
  Dio.Options options = Dio.Options(
    validateStatus: (e) => true,
    receiveDataWhenStatusError: true,
    responseType: Dio.ResponseType.plain,
  );
  FutureOr${Json2classBase.func.addX('Reply')} fetch(Plan plan) async {
    var path = plan.path;
    if (plan.seg != null) {
      var seg = plan.seg?.toJson();
      path = path.replaceAllMapped(new RegExp('{(.*?)}'), (match) => seg?[match.group(1)] ?? '');
    }
    var origin = await dio.request(
      '\${plan.baseURL}\${path}',
      queryParameters: plan.params?.toJson(),
      data: await body(plan),
      options: options
        ..method = plan.method
        ..contentType = plan.body?.contentType,
    );
    plan.reply.origin = origin;
    plan.reply.code = origin.statusCode ?? 0;
    plan.reply.message = origin.statusMessage ?? '';
    try {
      plan.reply.data = Convert.jsonDecode(origin.data);
    } catch (e) {
      plan.reply.data = origin.data;
    }
    return plan.reply;
  }

  dynamic body(Plan plan) {
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
    const { agentConfig } = this;
    return `import 'dart:async';
import 'dart:typed_data';
${agentConfig.import}

@cls@

class Reply {
  int code = 0;
  String message = '';
  String error = '';
  dynamic data;
  dynamic origin;
}

abstract class Agent {
  FutureOr${addX('Reply')} fetch(Plan plan);
  dynamic body(Plan plan);
}
${agentConfig.code}
class BodyForm${addX('T extends Cls, K extends Cls')} {
  T fields;
  K files;
  BodyForm({
    required this.fields,
    required this.files,
  });
}

class Body${addX('T')} {
  static Map${addX('String, String')} _types = {${Base.bodyTypes
      .map(k => `'${k}': '${(Base.contentTypes as Record<string, string>)[k]}'`)
      .join(',')}};

  final String type;
  T data;

  final String? contentType;

  Body({
    required this.type,
    required this.data,
  }) : contentType = _types[type];
}

class Hook {
  FutureOr${addX('void')} Function(Plan) before = (Plan plan) {};
  FutureOr${addX('void')} Function(Plan) after = (Plan plan) {};
  FutureOr${addX('Reply')} Function(Plan) validate = (Plan plan) {
    try {
      if (plan.reply.data['statusCode'] != '0') {
        plan.reply.error = plan.reply.data['statusMessage'];
      }
    } catch (e) {
      plan.reply.error = e.toString();
    }
    return plan.reply;
  };
}

class HttpError implements Exception {
  final Plan plan;
  HttpError({required this.plan});
  String toString() => plan.reply.error.isNotEmpty ? plan.reply.error : plan.reply.message;
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

  ${agentConfig.name} agent = ${agentConfig.name}();

  Reply reply = Reply();
  
  Hook hook = Hook();

  FutureOr${addX('Plan<R, S, P, B>')} Function(Plan${addX('R, S, P, B')} plan) request = (Plan${addX(
      'R, S, P, B',
    )} plan) async {
    await plan.hook.before(plan);
    plan.reply = await plan.agent.fetch(plan);
    plan.reply = await plan.hook.validate(plan);
    plan.res.fromAny(plan.reply.data);
    await plan.hook.after(plan);
    if (plan.reply.code != 200 && plan.reply.message.isNotEmpty) {
      throw HttpError(plan: plan);
    }
    if (plan.reply.error.isNotEmpty) {
      throw HttpError(plan: plan);
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
