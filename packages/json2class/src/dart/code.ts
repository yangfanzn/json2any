import { Complex as _Complex, Simple as _Simple, BaseType } from '../base';
import { func } from './func';

export class Complex extends _Complex {
  child: (Complex | Simple)[] = [];

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
    return this.child.reduce<{ context: Complex; code: string }[]>(
      (list, cur) => {
        list.push(...(cur instanceof Complex ? cur.toCode() : []));
        return list;
      },
      [
        {
          context: this,
          code: `
class ${this.nameClass} extends Cls {
  ${this.toCreate()}
  ${this.child.map(e => e.toProp()).join(`\n${' '.repeat(2)}`)}
  ${this.nameClass} fromJson(dynamic data, {Option Function(Option option)? setOption, Option? option}) {
    Option opt = option ?? (setOption == null ? null : setOption(Cls.option.create())) ?? Cls.option;
    ${this.child.map(e => e.toSet()).join(`\n${' '.repeat(4)}`)}
    return this;
  }
}`,
        },
      ],
    );
  }
}

export class Simple extends _Simple {
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
