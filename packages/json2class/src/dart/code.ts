import * as Base from '../base';
import { keywords } from './keywords';

export class Lang extends Base.Lang {
  keywords = keywords;

  arrayType(array: boolean[], type: string): string {
    return array.reduce((v, e) => {
      return `List${Base.func.addX(`${v}${e ? '?' : ''}`)}`;
    }, type);
  }

  toProp(key: Base.Key) {
    if (key.array.length) {
      if (key.optional) {
        return `${this.arrayType(key.array, key.decl)}? ${key.prop};`;
      } else {
        return `${this.arrayType(key.array, key.decl)} ${key.prop} = [];`;
      }
    } else {
      if (key.optional) {
        return `${key.decl}? ${key.prop};`;
      } else {
        return `${key.decl} ${key.prop} = ${key.def};`;
      }
    }
  }
}

export class Complex extends Base.Complex {
  lang = new Lang();

  toClass() {
    return `
class ${this.decl} extends Json2class {
  ${this.child.map(e => this.lang.toProp(e)).join('')}
  String preset = '${Base.func.convertWrap(JSON.stringify(this.origin))}';
  ${this.decl} fromJson(dynamic data, {void Function(Option option)? setOption, Option? option}) {
    Option opt = (option ?? this.option ?? Json2class.defaultOption).copy(); setOption?.call(opt);
    ${this.child.map(e => e.toFromJson()).join('')}
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

  baseDef = {
    [Base.BaseType.String]: { decl: 'String', def: "''" },
    [Base.BaseType.Number]: { decl: 'num', def: '0' },
    [Base.BaseType.Boolean]: { decl: 'bool', def: 'false' },
  };
}
