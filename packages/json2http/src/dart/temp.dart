// code import 'package:http/http.dart' as Http;
// code import 'dart:convert' as Convert;

// start-cls
class Cls {
  Map<String, dynamic> toJson() {
    return {};
  }

  Cls fromJson(dynamic data) {
    return this;
  }
}
// end-cls

class Answer {
  String code = '';
  String message = '';
  String error = '';
  dynamic data;
  dynamic origin;
}

class Plan<R extends Cls, P extends Cls?, D extends Cls?, F extends Cls?> {
  String baseURL = '';

  String path;
  String title;
  String method;

  R res;

  P params;
  D data;
  F form;

  Plan({
    required this.path,
    required this.title,
    required this.method,
    required this.params,
    required this.data,
    required this.form,
    required this.res,
  });

  Answer answer = Answer();

  Future<Answer> Function(Plan) transform = (Plan plan) async {
    return plan.answer;
  };

/* code
  static Http.Client _client = Http.Client();
  Future<Http.Client> Function(Plan) client = (Plan plan) async {
    return Plan._client;
  };

  Future<Answer> Function(Plan) http = (Plan plan) async {
    var client = await plan.client(plan);
    var request = Http.Request(plan.method, Uri.parse(plan.path));
    if (plan.data != null) {
      request.body = Convert.jsonEncode(plan.data);
    }
    var origin = await Http.Response.fromStream(await client.send(request));
    plan.answer.origin = origin;
    plan.answer.data = origin.body;
    return plan.answer;
  };
code */
  Future<Plan> Function(Plan plan) request = (Plan plan) async {
    // code plan.answer = await plan.http(plan);
    if (plan.answer.code != '200') {
      throw plan.answer.message;
    }
    plan.answer = await plan.transform(plan);
    if (plan.answer.error.isNotEmpty) {
      throw plan.answer.error;
    }
    plan.res.fromJson(plan.answer.data);
    return plan;
  };
}
