// code import 'package:http/http.dart' as Http;

// start-cls
class Cls {
  Cls fromString(String _) => fromJson('{}');

  Cls fromJson(dynamic _) => this;

  Map<String, dynamic> toJson() => {};
}
// end-cls

class Answer {
  int code = 0;
  String message = '';
  String error = '';
  dynamic data;
  dynamic origin;
}

class Plan<R extends Cls, P extends Cls?, D extends Cls?, F extends Cls?, U extends Cls?> {
  String baseURL = '';

  String path;
  String title;
  String method;

  R res;

  P params;
  D data;
  F form;
  U url;

  Plan({
    required this.path,
    required this.title,
    required this.method,
    required this.res,
    required this.params,
    required this.data,
    required this.form,
    required this.url,
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
    var request = Http.Request(plan.method, Uri.parse('${plan.baseURL}${plan.path}'));
    if (plan.data != null) {
      request.body = Convert.jsonEncode(plan.data);
    }
    var origin = await Http.Response.fromStream(await client.send(request));
    plan.answer.origin = origin;
    plan.answer.code = origin.statusCode;
    // plan.answer.message = origin.statusCode;
    plan.answer.data = origin.body;
    return plan.answer;
  };
code */
  Future<Plan<R, P, D, F, U>> Function(Plan<R, P, D, F, U> plan) request = (Plan<R, P, D, F, U> plan) async {
    // code plan.answer = await plan.http(plan);
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
