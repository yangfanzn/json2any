// open import 'package:http/http.dart' as Http;

// replace-start-cls
class Cls {
  Cls fromString(String _) => fromJson('{}');

  Cls fromJson(dynamic _) => this;

  Map<String, dynamic> toJson() => {};
}
// replace-end-cls

class Answer {
  int code = 0;
  String message = '';
  String error = '';
  dynamic data;
  dynamic origin;
}

class Plan<R extends Cls, P extends Cls?, D extends Cls?, F extends Cls?, S extends Cls?> {
  String baseURL = '';

  String path;

  S seg;

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
    required this.res,
    required this.params,
    required this.data,
    required this.form,
    required this.seg,
  });

  Answer answer = Answer();

  Future<Answer> Function(Plan) transform = (Plan plan) async {
    return plan.answer;
  };

/* open
  static Http.Client _client = Http.Client();
  Future<Http.Client> Function(Plan) client = (Plan plan) async {
    return Plan._client;
  };

  Future<Answer> Function(Plan) http = (Plan plan) async {
    var client = await plan.client(plan);
    var path = plan.path;
    if (plan.seg != null) {
      var seg = plan.seg?.toJson();
      path = path.replaceAllMapped(new RegExp('{(.*?)}'), (match) => seg?[match.group(1)] ?? '');
    }
    var params = plan.params == null ? '' : '?${Uri(queryParameters: plan.params?.toJson()).query}';
    var request = Http.Request(plan.method, Uri.parse('${plan.baseURL}${path}${params}'));
    if (plan.data != null) {
      request.body = Convert.jsonEncode(plan.data);
    } else if (plan.form != null) {
      request.bodyFields = plan.form?.toJson().map((k, v) => MapEntry(k, v)) ?? {};
    }
    var origin = await Http.Response.fromStream(await client.send(request));
    plan.answer.origin = origin;
    plan.answer.code = origin.statusCode;
    plan.answer.message = origin.body; // ?? origin.reasonPhrase;
    plan.answer.data = origin.body;
    return plan.answer;
  };
open */
  Future<Plan<R, P, D, F, S>> Function(Plan<R, P, D, F, S> plan) request = (Plan<R, P, D, F, S> plan) async {
    // open plan.answer = await plan.http(plan);
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
