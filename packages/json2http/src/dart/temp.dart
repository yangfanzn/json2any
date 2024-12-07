// start-cls
class Cls {}
// end-cls

typedef _ = void Function(Plan plan);

class Plan<P, D, F> {
  final title;
  final method;

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
