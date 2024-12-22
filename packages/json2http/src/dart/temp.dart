// open import 'package:dio/dio.dart' as Dio;
// open import 'dart:typed_data' as TypedData;

// replace-start-cls
import 'dart:convert' as Convert;

class Cls {
  Cls fromString(String _) => fromJson('{}');

  Cls fromJson(dynamic _) => this;

  Map<String, dynamic> toJson() => {};
}
// replace-end-cls

class Body<T> {
  static Map<String, String> _types = {
    'json': 'application/json',
    'map': 'application/x-www-form-urlencoded',
    'form': 'multipart/form-data',
    'binary': 'application/octet-stream',
    'plain': 'text/plain',
  };

  final String type;
  T data;

  final String? contentType;

  Body({
    required this.type,
    required this.data,
  }) : contentType = _types[type];

  encode() {
    if (type == 'json') {
      try {
        Convert.jsonEncode(data);
      } catch (e) {
        print(e);
        (data as Cls).toJson().forEach((a, b) {
          print(a.runtimeType);
          print(b.runtimeType);
        });
      }

      return Convert.jsonEncode(data);
    } else if (type == 'map') {
      return (data as Cls).toJson();
    } else {
      return data;
    }
  }
}

class Answer {
  int code = 0;
  String message = '';
  String error = '';
  dynamic data;
  dynamic origin;
}

abstract class Executor {
  Future<Answer> request(Plan plan);
}

class DioExecutor extends Executor {
  // open Dio.Options options = Dio.Options();
  Future<Answer> request(Plan plan) async {
/* open
    var path = plan.path;
    if (plan.seg != null) {
      var seg = plan.seg?.toJson();
      path = path.replaceAllMapped(new RegExp('{(.*?)}'), (match) => seg?[match.group(1)] ?? '');
    }
    var origin = await Dio.Dio().request(
      '${plan.baseURL}${path}',
      queryParameters: plan.params?.toJson(),
      data: plan.body?.encode(),
      options: options
        ..method = plan.method
        ..contentType = plan.body?.contentType
        ..receiveDataWhenStatusError = true
        ..validateStatus = (e) => true,
    );
    plan.answer.origin = origin;
    plan.answer.code = origin.statusCode ?? 0;
    plan.answer.message = origin.statusMessage ?? '';
    plan.answer.data = origin.data;
open */
    return plan.answer;
  }
}

class Plan<R extends Cls, S extends Cls?, P extends Cls?, B extends Body?> {
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

  Executor executor = DioExecutor();

  Answer answer = Answer();

  Future<Answer> Function(Plan) transform = (Plan plan) async {
    if (!RegExp('"statusCode":"0"').hasMatch(plan.answer.data)) {
      return plan.answer..error = plan.answer.data;
    }
    return plan.answer;
  };

  Future<Plan<R, S, P, B>> Function(Plan<R, S, P, B> plan) request = (Plan<R, S, P, B> plan) async {
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

// replace-deps
class Json2http {
  Json2http._();

  static Json2http single = Json2http._();
// replace-request
}
