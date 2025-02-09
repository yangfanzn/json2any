import * as Base from '../base';
import { keywords } from './keywords';

export class Lang extends Base.Lang {
  keywords = keywords;
}

export class Complex extends Base.Complex {
  lang = new Lang();

  toClass() {
    return `
class ${this.decl} extends Json2class {
  ${this.child.map(e => this.lang.toProp(e)).join('')}
  String preset = '${Base.func.convertWrap(JSON.stringify(this.preset))}';
  ${this.decl} fromJson(dynamic data, {void Function(Rule rule)? setRule, Rule? rule}) {
    final r = (rule ?? this.rule ?? Json2class.defaultRule).copy(); setRule?.call(r);
    ${this.child.map(e => e.lang.toFromJson(e)).join('')}
    return this;
  }
  toNew() => ${this.def};
  Map${Base.func.addX('String, dynamic')} toJson() {
    return {${this.child.map(e => `'${e.jsonKey}':_toJson(${e.prop})`)}};
  }
}`;
  }
}

export class Simple extends Base.Simple<Complex> {
  lang = new Lang();
}
