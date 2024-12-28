import Fs from 'fs';
import Path from 'path';
import { Base } from 'json2class';
import { Bin as _Bin } from '../base/bin';
import { contentTypes } from '../base';

class Bin extends _Bin {
  static innerExecutorConfigs: Record<
    string,
    {
      import: string;
      code: string;
    }
  > = {
    dio: {
      import: "import 'package:dio/dio.dart' as Dio;",
      code: `
class DioExecutor extends Executor {
  Dio.Dio dio = Dio.Dio();
  Dio.Options options = Dio.Options(validateStatus: (e) => true, receiveDataWhenStatusError: true);
  Future${Base.Func.addX('Answer')} request(Plan plan) async {
    var path = plan.path;
    if (plan.seg != null) {
      var seg = plan.seg?.toJson();
      path = path.replaceAllMapped(new RegExp('{(.*?)}'), (match) => seg?[match.group(1)] ?? '');
    }
    var origin = await dio.request(
      '\${plan.baseURL}\${path}',
      queryParameters: plan.params?.toJson(),
      data: plan.body?.encode(),
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
}  
`,
    },
  };

  toEntry() {
    let curExecutor = '';
    if (this.envHttp.extend) {
      const extend = Fs.readFileSync(this.envHttp.extend).toString();
      const [, disabled, , name] =
        extend.match(/(\/\/\s+@json2http-disabled(\s+))?class\s+(\w+)\s+extends\s+Executor\s+/) ?? [];
      curExecutor = disabled ? '' : name ?? '';
      if (curExecutor) {
        curExecutor = `Extend.${curExecutor}()`;
      }
    } else {
    }
    curExecutor ||= `${Base.Func.toUpperCaseFirst(this.envHttp.innerExecutor)}Executor()`;

    const executorConfig = Bin.innerExecutorConfigs[this.envHttp.innerExecutor] ?? { import: '', code: '' };
    return `
import 'dart:typed_data' as TypedData;
${executorConfig.import}
${this.envHttp.extend ? `import '${Path.relative(this.envHttp.output, this.envHttp.extend)}' as Extend;` : ''}

@cls@

class Answer {
  int code = 0;
  String message = '';
  String error = '';
  dynamic data;
  dynamic origin;
}

class Executor {
  Future${Base.Func.addX('Answer')} request(Plan plan) async => plan.answer;
}

${executorConfig.code}


class BodyForm${Base.Func.addX('T')} {
  T fields;
  BodyForm({
    required this.fields,
  });
}

class Body${Base.Func.addX('T')} {
  static Map${Base.Func.addX('String, String')} _types = {${Object.keys(contentTypes)
      .map(k => `'${k}': '${(contentTypes as Record<string, { header: string }>)[k].header}'`)
      .join(',')}};

  final String type;
  T data;

  final String? contentType;

  Body({
    required this.type,
    required this.data,
  }) : contentType = _types[type];

  encode() {
    if (type == 'json') {
      return Convert.jsonEncode(data);
    } else if (type == 'map') {
      return (data as Cls).toJson();
    } else {
      return data;
    }
  }
}

class Plan${Base.Func.addX('R extends Cls, S extends Cls?, P extends Cls?, B extends Body?')} {
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

  Executor executor = ${curExecutor};

  Answer answer = Answer();

  Future${Base.Func.addX('Answer')} Function(Plan) transform = (Plan plan) async {
    if (!RegExp('"statusCode":"0"').hasMatch(plan.answer.data)) {
      return plan.answer..error = plan.answer.data;
    }
    return plan.answer;
  };

  Future${Base.Func.addX('Plan<R, S, P, B>')} Function(Plan${Base.Func.addX(
      'R, S, P, B',
    )} plan) request = (Plan${Base.Func.addX('R, S, P, B')} plan) async {
    plan.answer = await plan.executor.request(plan);
    if (plan.answer.code != 200) {
      throw plan.answer.message;
    }
    plan.answer = await plan.transform(plan);
    if (plan.answer.error.isNotEmpty) {
      throw plan.answer.error;
    }
    plan.res.fromString(plan.answer.data);
    return plan;
  };
}

@types@

@deps@

class Json2http {
  Json2http._();
  static Json2http single = Json2http._();
  static Future${Base.Func.addX('void')} Function(Plan plan) option = (Plan plan) async {};

@request@

}

`;
  }
}

export const bin = new Bin();
