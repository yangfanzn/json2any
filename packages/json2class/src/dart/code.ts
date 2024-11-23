import { _C, _S, _T } from '../base';
import { fun } from './fun';

export class C extends _C {
  child: (C | S)[] = [];

  toCreate() {
    return `create() => ${this.nameClass}();`;
  }

  toProp() {
    if (this.array.length) {
      if (this.optional) {
        return `${fun.arrayType(this.array, this.nameClass)}? ${this.nameProp};`;
      } else {
        return `${fun.arrayType(this.array, this.nameClass)} ${this.nameProp} = [];`;
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

  toClass() {
    return this.child.reduce<{ context: C; code: string }[]>(
      (list, cur) => {
        list.push(...(cur instanceof C ? cur.toClass() : []));
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

export class S extends _S {
  toSet() {
    const t = this.toDefVal(this.type);
    return `${this.nameProp} = setVal<${t.type}>(data, '${this.nameProp}', <bool>[${this.array}], ${this.optional}, ${this.nameProp}, ${t.value}, opt);`;
  }

  toProp() {
    const t = this.toDefVal(this.type);
    if (this.array.length) {
      if (this.optional) {
        return `${fun.arrayType(this.array, t.type)}? ${this.nameProp};`;
      } else {
        return `${fun.arrayType(this.array, t.type)} ${this.nameProp} = [];`;
      }
    } else {
      if (this.optional) {
        return `${t.type}? ${this.nameProp};`;
      } else {
        return `${t.type} ${this.nameProp} = ${t.value};`;
      }
    }
  }

  toDefVal(x: _T) {
    return {
      [_T.String]: { type: 'String', value: "''" },
      [_T.Number]: { type: 'num', value: '0' },
      [_T.Boolean]: { type: 'bool', value: 'false' },
    }[x];
  }
}
