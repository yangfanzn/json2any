import { Complex as _Complex, Simple as _Simple, BaseType, Key } from '../base';
import { func } from './func';

export class Complex<S extends Key = Simple<Key>> extends _Complex<S> {
  toCreate() {
    return `create() => ${this.nameClass}();`;
  }

  toProp() {
    if (this.array.length) {
      if (this.optional) {
        return `${func.arrayType(this.array, this.nameClass)}? ${this.nameProp};`;
      } else {
        return `${func.arrayType(this.array, this.nameClass)} ${this.nameProp} = [];`;
      }
    } else {
      if (this.optional) {
        return `${this.nameClass}? ${this.nameProp};`;
      } else {
        return `${this.nameClass} ${this.nameProp} = ${this.nameClass}();`;
      }
    }
  }

  toSet() {
    return `${this.nameProp} = setVal<${this.nameClass}>(data, '${this.nameProp}', <bool>[${this.array}], ${this.optional}, ${this.nameProp}, ${this.nameClass}(), opt);`;
  }

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
            code: `
class ${this.nameClass} extends Cls {
  ${this.toCreate()}
  ${this.child.map(e => e.toProp()).join('')}
  ${this.nameClass} fromJson(dynamic data, {Option Function(Option option)? setOption, Option? option}) {
    Option opt = option ?? (setOption == null ? null : setOption(Cls.option.create())) ?? Cls.option;
    ${this.child.map(e => e.toSet()).join('')}
    return this;
  }
}`,
          },
        ],
      );
  }
}

export class Simple<C extends Key = Complex<Key>> extends _Simple<C> {
  toSet() {
    const t = this.toDefVal(this.type);
    return `${this.nameProp} = setVal<${t.type}>(data, '${this.nameProp}', <bool>[${this.array}], ${this.optional}, ${this.nameProp}, ${t.value}, opt);`;
  }

  toProp() {
    const t = this.toDefVal(this.type);
    if (this.array.length) {
      if (this.optional) {
        return `${func.arrayType(this.array, t.type)}? ${this.nameProp};`;
      } else {
        return `${func.arrayType(this.array, t.type)} ${this.nameProp} = [];`;
      }
    } else {
      if (this.optional) {
        return `${t.type}? ${this.nameProp};`;
      } else {
        return `${t.type} ${this.nameProp} = ${t.value};`;
      }
    }
  }

  toDefVal(x: BaseType) {
    return {
      [BaseType.String]: { type: 'String', value: "''" },
      [BaseType.Number]: { type: 'num', value: '0' },
      [BaseType.Boolean]: { type: 'bool', value: 'false' },
    }[x];
  }
}
