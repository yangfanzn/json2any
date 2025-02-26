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
        bodyDecl = `Body${addX(`${bodyDecl}${body.data.optional ? '?' : ''}`)}`;
      } else if (body.type === 'plain') {
        bodyDecl = `Body${addX('String?')}`;
        bodyDef = `Body(type: '${body.type}', data: '')`;
      } else if (body.type === 'byte') {
        bodyDecl = `Body${addX('Uint8List?')}`;
        bodyDef = `Body(type: '${body.type}', data: Uint8List(0))`;
      } else if (body.data) {
        bodyDecl = `Body${addX(`${body.data.decl}${body.data.optional ? '?' : ''}`)}`;
        bodyDef = `Body(type: '${body.type}', data: ${body.data.def})`;
      } else {
        Base.func.unreachableError(`[${plan.path.origin}] unknown body type parsing`);
      }
    }

    const types = [
      `var path = '${plan.path.origin}'`,
      `covariant ${plan.seg?.decl ?? 'Null'} seg = ${plan.seg?.def ?? 'null'}`,
      `var title = '${plan.title.origin}'`,
      `var method = '${plan.method.origin}'`,
      `covariant ${plan.res?.decl ?? 'Null'} res = ${plan.res?.def ?? 'null'}`,
      `covariant ${plan.params?.decl ?? 'Null'} params = ${plan.params?.def ?? 'null'}`,
      `covariant ${bodyDecl} body = ${bodyDef}`,
      // why use Convert.jsonDecode even if the value is Map<String, "dynamic"> ?
      //   the important reason is headers like body.files both support String and List<String>,
      //   but the dart does not support Map<String, String | List<String>>, if the tools make headers to a special type
      //   is unsuitable，because of headers usually does not change on a special request but need change on a common request with Map.
      //   finally, if it is hardcoded as xxx, it would also feel strange.
      `var headers = _Convert.jsonDecode('${Base.func.convertWrap(JSON.stringify(plan.headers?.origin ?? {}))}')`,
    ].join('; ');

    return {
      code: `
Future${addX(this.declPlan)} ${this.launch}(FutureOr${addX('void')} Function(${this.declPlan} plan) setPlan) async {
  final plan = ${this.declPlan}();
  await Json2http.setPlan?.call(plan);
  await setPlan(plan);
  await (plan.start ?? plan.request)();
  return plan;
}`,
      plan: `
class ${this.declPlan} extends Plan { ${types}; }`,
    };
  }

  static get agentConfig() {
    const { func, env, DefaultAgent } = Base;
    switch (env.defaultAgent) {
      case DefaultAgent.Dart_Dio5:
        return {
          name: 'DioAgent',
          import: "import 'package:dio/dio.dart' as _Dio;",
          code: `
class DioAgent extends Agent {
  static _Dio.Dio _session = _Dio.Dio(_Dio.BaseOptions(
    validateStatus: (e) => true,
    receiveDataWhenStatusError: true,
    responseType: _Dio.ResponseType.plain,
  ));
  
  _Dio.Dio? session;
  _Dio.RequestOptions? option;
  _Dio.Response? response;

  Future${func.addX('Reply')} fetch(Plan plan) async {
    final session = this.session ?? _session;

    var path = plan.path;
    if (plan.seg != null) {
      final seg = plan.seg?.toJson();
      path = path.replaceAllMapped(new RegExp('{(.*?)}'), (match) => seg?[match.group(1)] ?? '');
    }

    final option = this.option = _Dio.Options(
      method: plan.method,
      contentType: plan.body?.contentType,
      headers: plan.headers,
    ).compose(
      session.options,
      '\${plan.baseURL}\${path}',
      data: await body(plan),
      queryParameters: plan.params?.toJson(),
      sourceStackTrace: StackTrace.current,
    );

    await plan.ready?.call();

    final response = this.response = await session.fetch(option).whenComplete(() => this.session?.close());
    plan.reply.code = response.statusCode;
    plan.reply.message = response.statusMessage ?? code2message[plan.reply.code.toString()] ?? 'unknown http code \${plan.reply.code}';

    try {
      plan.reply.data = _Convert.jsonDecode(response.data);
    } catch (e) {
      plan.reply.data = response.data;
    }
    
    return plan.reply;
  }

  Object? body(Plan plan) {
    final type = plan.body?.type;
    final data = plan.body?.data;
    if (type == null) {
      return null;
    } else if (type == 'json') {
      return _Convert.jsonEncode(data);
    } else if (type == 'map' && data is Json2class) {
      return data.toJson();
    } else if (type == 'form' && data is BodyForm) {
      final a2b = (BodyFormFile a) {
        final filepath = a.filepath;
        final content = a.content;
        final contentType = a.contentType == null ? null : _Dio.DioMediaType.parse(a.contentType ?? '');
        if (filepath != null) {
          return _Dio.MultipartFile.fromFile(filepath,
            filename: a.filename, contentType: contentType, headers: a.headers);
        } else if (content != null) {
          return _Dio.MultipartFile.fromBytes(content,
            filename: a.filename, contentType: contentType, headers: a.headers);
        } else {
          return null;
        }
      };
      final map = ${func.addX(`String, List${func.addX('dynamic')}`)}{};
      final cb = (String k, dynamic v) {
        if (!map.containsKey(k)) {
          map[k] = [];
        }
        v = (v is List ? v : [v]).map((e) => e is BodyFormFile ? a2b(e) : e).where((e) => e != null);
        map[k]?.addAll(v);
      };
      data.fields.toJson().forEach(cb);
      data.files.toJson().forEach(cb);
      return _Dio.FormData.fromMap(map);
    } else {
      return data;
    }
  }
}`,
        };
      default:
        func.unreachableError('defaultAgent', [env.defaultAgent]);
        return { name: '', import: '', code: '' };
    }
  }

  static toEntry() {
    const { addX } = Base.func;
    const { agentConfig } = this;
    return `import 'dart:async';
import 'dart:typed_data';
${agentConfig.import}

@json2class@

class Reply {
  int? code;
  String message = '';
  String? error;
  Object? data;
  Exception? exception;
  void reset() {
    code = error = data = exception = null;
    message = '';
  }
}
abstract class Agent {
  Future${addX('Reply')} fetch(Plan plan);
  FutureOr${addX('Object?')} body(Plan plan);
}${agentConfig.code}
class BodyFormFile {
  final Uint8List? content;
  final String? filepath;
  String? filename;
  String? contentType;
  Map${addX(`String, List${addX('String')}`)}? headers;

  BodyFormFile.fromFile(this.filepath)
    : content = null;
  BodyFormFile.fromString(String value)
    : filepath = null, content = _Convert.utf8.encode(value);
  BodyFormFile.fromBytes(List${addX('int')} value)
    : filepath = null, content = Uint8List.fromList(value);
}
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
class Json2httpError implements Exception {
  final Plan plan;
  Json2httpError(this.plan);
  String toString() => (plan.reply.error?.isNotEmpty ?? false) ? plan.reply.error! : plan.reply.message;
}

abstract class Plan {
  String baseURL = '';

  abstract String path;
  abstract Json2class? seg;

  abstract String title;
  abstract String method;
  abstract Json2class? res;

  abstract Json2class? params;
  abstract Body${addX('Object?')}? body;

  abstract Map${addX('String, dynamic')} headers;

  Agent agent = DioAgent();

  Reply reply = Reply();

  FutureOr${addX('void')} abort() {
    if (this.reply.code != 200 && this.reply.message.isNotEmpty) {
      throw Json2httpError(this);
    }
    if (this.reply.error?.isNotEmpty ?? false) {
      throw Json2httpError(this);
    }
  }

  Future${addX('void')} fetch() async {
    this.reply.reset();
    this.reply = await this.agent.fetch(this).catchError((e) {
      if (e is Exception) {
        this.reply.exception = e;
        this.reply.error = e.toString();
        return this.reply;
      }
      throw e;
    }).whenComplete(() async {
      await this.process?.call(this.reply);
    });
  }

  Future${addX('void')} request() async {
    await this.before?.call();
    await this.fetch();
    await this.after?.call();
    this.res?.fromAny(this.reply.data);
    await (this.end ?? this.abort)();
  }

  FutureOr${addX('void')} Function()? start;
  FutureOr${addX('void')} Function()? before;
  FutureOr${addX('void')} Function()? ready;
  FutureOr${addX('void')} Function(Reply)? process;
  FutureOr${addX('void')} Function()? after;
  FutureOr${addX('void')} Function()? end;
}
@aliases@
@deps@

class Json2http {
  Json2http._();
  static Json2http single = Json2http._();
  static FutureOr${addX('void')} Function(Plan plan)? setPlan;
@request@
}

final code2message = _Convert.jsonDecode('${Base.func.convertWrap(JSON.stringify(Base.code2message))}');
`;
  }
}
