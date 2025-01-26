import { Json2classDart } from 'json2class';
import * as Base from '../base';

export class Complex extends Json2classDart.Complex {}

export class Simple extends Json2classDart.Simple {}

export class Http extends Base.Http<Complex, Simple> {
  toLaunch(plan: Base.SchemaPlan) {
    const { addX } = Base.func;

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
      `path: '${plan.path.origin}'`,
      `seg: ${plan.seg ? plan.seg.def : 'null'}`,
      `title: '${plan.title.origin}'`,
      `method: '${plan.method.origin}'`,
      `res: ${plan.res.def}`,
      `params: ${plan.params ? plan.params.def : 'null'}`,
      `body: ${bodyDef}`,
      // why use Convert.jsonDecode even if then value is Map<String, dynamic>
      //    the important reason is headers like body.files both support String and List<String>
      //    but the dart does not support Map<String, String | List<String>>, if the tools make headers to a special type
      //    is unsuitable，because of headers usually does not change on a special request but need change on a common request with Map
      `headers: ${
        plan.headers ? `Convert.jsonDecode('${Base.func.convertWrap(JSON.stringify(plan.headers.origin))}')` : 'null'
      }`,
    ].join(', ');

    return {
      code: `
Future${addX(this.declPlan)} ${this.launch}(FutureOr${addX('void')} Function(${this.declPlan} plan) setPlan) async {
  var plan = Plan(${args});
  await Json2http.setPlan(plan);
  await setPlan(plan);
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
  static Dio.Dio dio = Dio.Dio(Dio.BaseOptions(
    validateStatus: (e) => true,
    receiveDataWhenStatusError: true,
    responseType: Dio.ResponseType.plain,
  ));

  // ready is the only hook where option can be set
  late Dio.RequestOptions option;

  Future${Base.func.addX('Reply')} fetch(Plan plan) async {
    var path = plan.path;
    if (plan.seg != null) {
      var seg = plan.seg?.toJson();
      path = path.replaceAllMapped(new RegExp('{(.*?)}'), (match) => seg?[match.group(1)] ?? '');
    }

    plan.agent.option = Dio.Options(
      method: plan.method,
      contentType: plan.body?.contentType,
      headers: plan.headers,
    ).compose(
      dio.options,
      '\${plan.baseURL}\${path}',
      data: await body(plan),
      queryParameters: plan.params?.toJson(),
      sourceStackTrace: StackTrace.current,
    );
    await plan.ready?.call();
    var origin = await dio.fetch(plan.agent.option);

    plan.reply.origin = origin;
    plan.reply.code = origin.statusCode ?? 0;
    plan.reply.message = origin.statusMessage ?? '';
    try {
      plan.reply.data = Convert.jsonDecode(origin.data);
    } catch (e) {
      plan.reply.data = origin.data;
    }
    plan.reply.error = await (plan.validate?.call() ?? '');
    return plan.reply;
  }

  Object? body(Plan plan) {
    var type = plan.body?.type;
    var data = plan.body?.data;
    if (type == null) {
      return null;
    } else if (type == 'json') {
      return Convert.jsonEncode(data);
    } else if (type == 'map' && data is Json2class) {
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
    const { addX } = Base.func;
    const { agentConfig } = this;
    return `import 'dart:async';
import 'dart:typed_data';
${agentConfig.import}

@json2class@

class Reply {
  int code = 0;
  String message = '';
  String error = '';
  dynamic data;
  dynamic origin;
}

abstract class Agent {
  Future${addX('Reply')} fetch(Plan plan);
  dynamic body(Plan plan);
}
${agentConfig.code}
class BodyForm${addX('T extends Json2class, K extends Json2class')} {
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

class HttpError implements Exception {
  final Plan plan;
  HttpError({required this.plan});
  String toString() => plan.reply.error.isNotEmpty ? plan.reply.error : plan.reply.message;
}

class Plan${addX('R extends Json2class, S extends Json2class?, P extends Json2class?, B extends Body?')} {
  String baseURL = '';

  String path;
  S seg;

  String title;
  String method;
  R res;

  P params;
  B body;
  
  Map${addX('String, dynamic')} headers;

  Plan({
    required this.path,
    required this.seg,
    required this.title,
    required this.method,
    required this.res,
    required this.params,
    required this.body,
    Map${addX('String, dynamic')}? headers,
  }) : headers = headers ?? {};

  ${agentConfig.name} agent = ${agentConfig.name}();

  Reply reply = Reply();

  Future${addX('Plan<R,S,P,B>')} Function(Plan${addX('R,S,P,B')} plan) request = (plan) async {
    await plan.before?.call();
    plan.reply = await plan.agent.fetch(plan);
    await plan.after?.call();
    plan.res.fromAny(plan.reply.data);
    await (plan.end ?? plan.abort)();
    return plan;
  };
  
  abort() {
    if (this.reply.code != 200 && this.reply.message.isNotEmpty) {
      throw HttpError(plan: this);
    }
    if (this.reply.error.isNotEmpty) {
      throw HttpError(plan: this);
    }
  }
  
  FutureOr${addX('void')} Function()? before;
  FutureOr${addX('void')} Function()? ready;
  FutureOr${addX('String')} Function()? validate;
  FutureOr${addX('void')} Function()? after;
  FutureOr${addX('void')} Function()? end;
}

@aliases@

@deps@

class Json2http {
  Json2http._();
  static Json2http single = Json2http._();
  static FutureOr${addX('void')} Function(Plan plan) setPlan = (Plan plan) {};

@request@

}
`;
  }
}
