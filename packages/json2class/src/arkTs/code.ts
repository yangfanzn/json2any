import * as Base from '../base';
import { keywords } from './keywords';

export class Lang extends Base.Lang {
  keywords = keywords;

  baseDef = {
    [Base.BaseType.String]: { decl: 'string', def: "''" },
    [Base.BaseType.Number]: { decl: 'number', def: '0' },
    [Base.BaseType.Boolean]: { decl: 'boolean', def: 'false' },
  };

  arrayValue(value: boolean[]): string {
    return `[${value}]`;
  }

  arrayType(array: boolean[], type: string): string {
    return array.reduce((v, e) => {
      return `Array${Base.func.addX(`${v}${e ? '|null' : ''}`)}`;
    }, type);
  }

  toProp(key: Base.Key) {
    if (key.array.length) {
      if (key.optional) {
        return `${key.prop}: ${this.arrayType(key.array, key.decl)} | null = null;`;
      } else {
        return `${key.prop}: ${this.arrayType(key.array, key.decl)} = [];`;
      }
    } else {
      if (key.optional) {
        return `${key.prop}: ${key.decl} | null = null;`;
      } else {
        return `${key.prop}: ${key.decl} = ${key.def};`;
      }
    }
  }

  toFromJson(key: Base.Key): string {
    return `this.${key.prop} = this._fromJson<${key.decl}>(data, '${key.jsonKey}', ${this.arrayValue(key.array)}, ${
      key.optional
    }, this.${key.prop}, ${key.def}, r) as ${this.arrayType(key.array, key.decl)};`;
  }
}

export class Complex extends Base.Complex {
  lang = new Lang();

  toClass() {
    return `
export class ${this.decl} extends Json2class {
  ${this.child.map(e => this.lang.toProp(e)).join('')}
  preset = '${Base.func.convertWrap(JSON.stringify(this.preset))}';
  fromJson(data: Any, setRule?: (rule: Rule) => void, rule?: Rule): ${this.decl} {
    const r = (rule ?? this.rule ?? Json2class.defaultRule).copy(); setRule?.(r);
    ${this.child.map(e => e.lang.toFromJson(e)).join('')}
    return this;
  }
  toNew() {
    return ${this.def};
  }
  toJson(): Record${Base.func.addX('string, Any')} {
    return {${this.child.map(e => `'${e.jsonKey}':this._toJson(this.${e.prop})`)}};
  }
}`;
  }
}

export class Simple extends Base.Simple<Complex> {
  lang = new Lang();
}
