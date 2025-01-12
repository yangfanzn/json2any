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
    // todo: dynamic _, 用转换关键字变量替换(或用 this 明确指向，因为内部方法如 fromJson 也可能会冲突)
    return `
class ${this.decl} extends Cls {
  create() => ${this.def};
  ${this.child.map(e => this.lang.toProp(e)).join('')}
  ${this.decl} fromJson(dynamic _, {Option Function(Option _)? setOption, Option? option}) {
    Option opt = option ?? (setOption == null ? null : setOption(Cls.option.create())) ?? Cls.option;
    ${this.child.map(e => e.toFromJson()).join('')}
    return this;
  }
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
