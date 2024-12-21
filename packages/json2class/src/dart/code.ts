import { Complex as _Complex, Simple as _Simple, BaseType, Key } from '../base';
import { func } from './func';

export class Complex<S extends Key = Simple<Key>> extends _Complex<S> {
  toCode() {
    return this.child
      .filter(e => e instanceof Complex)
      .reduce(
        (codes, cur) => {
          codes.push(...cur.toCode());
          return codes;
        },
        [
          {
            context: this as this,
            // todo: dynamic _, 用转换关键字变量替换(或用 this 明确指向，因为内部方法如 fromJson 也可能会冲突)
            code: `
class ${this.decl} extends Cls {
  create() => ${this.def};
  ${this.child.map(e => func.toProp(e)).join('')}
  ${this.decl} fromJson(dynamic _, {Option Function(Option option)? setOption, Option? option}) {
    Option opt = option ?? (setOption == null ? null : setOption(Cls.option.create())) ?? Cls.option;
    ${this.child.map(e => e.toFromJson()).join('')}
    return this;
  }
  Map<String, dynamic> toJson() {
    return {${this.child.map(e => `r'${e.key}':_toJson(${e.prop})`)}};
  }
}`,
          },
        ],
      );
  }
}

export class Simple<C extends Key = Complex<Key>> extends _Simple<C> {
  toDecl2Def(x: BaseType) {
    return {
      [BaseType.String]: { decl: 'String', def: "''" },
      [BaseType.Number]: { decl: 'num', def: '0' },
      [BaseType.Boolean]: { decl: 'bool', def: 'false' },
    }[x];
  }
}
