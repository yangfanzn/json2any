// start-cls
class Cls {}
// end-cls

class Method {
  final String method;

  const Method(this.method);

  static const Post = const Method('post');
  static const Get = const Method('get');
  static const Put = const Method('put');
  static const Delete = const Method('delete');
}

typedef _ = void Function(Plan plan);

class Plan<P, D, F> {
  String title;
  Method method;

  P params;
  D data;
  F form;

  Plan({
    required this.title,
    required this.method,
    required this.params,
    required this.data,
    required this.form,
  });
}
