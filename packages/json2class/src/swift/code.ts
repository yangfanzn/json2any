import * as Base from '../base';
import { keywords } from './keywords';

export class Lang extends Base.Lang {
  keywords = keywords;

  baseDef = {
    [Base.BaseType.String]: { decl: 'String', def: '""' },
    [Base.BaseType.Number]: { decl: 'NSNumber', def: 'NSNumber(0)' },
    [Base.BaseType.Boolean]: { decl: 'Bool', def: 'false' },
  };

  arrayValue(value: boolean[]): string {
    return `[${value}]`;
  }

  arrayType(array: boolean[], type: string): string {
    return array.reduce((v, e) => {
      return `[${v}${e ? '?' : ''}]`;
    }, type);
  }

  toProp(key: Base.Key, typedef?: Record<string, string>) {
    const decl = typedef?.[key.decl] ?? key.decl;
    const def = key instanceof Base.Complex ? `${decl}()` : key.def;
    if (key.array.length) {
      if (key.optional) {
        return `var ${key.prop}: ${this.arrayType(key.array, decl)}? = nil`;
      } else {
        return `var ${key.prop}: ${this.arrayType(key.array, decl)} = []`;
      }
    } else {
      if (key.optional) {
        return `var ${key.prop}: ${decl}? = nil`;
      } else {
        return `var ${key.prop}: ${decl} = ${def}`;
      }
    }
  }

  toFromJson(key: Base.Key, typedef?: Record<string, string>) {
    // todo: 对比研究下
    // todo: def === 'null' 如果涉及更多判断，要从底层想办法优化
    const decl = typedef?.[key.decl] ?? key.decl;
    const def = key instanceof Base.Complex ? `${decl}()` : key.def;
    return `self.${key.prop} = self._fromJson(data, "${key.jsonKey}", ${this.arrayValue(key.array)}, ${
      key.optional
    }, self.${key.prop}, ${def === 'null' ? 'nil' : def}, r, type: ${this.arrayType(key.array, decl)}${
      key.optional ? '?' : ''
    }.self) as! ${this.arrayType(key.array, decl)}${key.optional ? '?' : ''}`;
  }
}

export class Complex extends Base.Complex {
  lang = new Lang();

  toDecl2Def() {
    const { decl, def } = super.toDecl2Def();
    return { decl, def: def.slice(4) };
  }

  toClass() {
    const { keys, decls } = this.child.reduce(
      (a, e) => {
        a.keys.push(e.key);
        a.decls.push(e.decl);
        return a;
      },
      { keys: [] as string[], decls: ['String'] as string[] },
    );
    const typedef = keys.reduce((a, e) => {
      if (decls.includes(e)) {
        a[e] = `_${e}_${Base.func.unique()}`;
      }
      return a;
    }, {} as Record<string, string>);
    return `
${Object.keys(typedef)
  .map(k => `typealias ${typedef[k]} = ${k};`)
  .join('')}
class ${this.decl}: Json2class {
  required init() {
    super.init()
    self.preset = "${Base.func.convertWrap(JSON.stringify(this.preset))}"
  }

  ${this.child.map(e => this.lang.toProp(e, typedef)).join('\n  ')}

  @discardableResult
  override func fromJson(_ data: Any?, setRule: ((Rule) -> Void)? = nil, rule: Rule? = nil) -> Self {
    let r = (rule ?? self.rule ?? Json2class.defaultRule).copy()
    setRule?(r)
    ${this.child.map(e => e.lang.toFromJson(e, typedef)).join('\n    ')}
    return self
  }

  override func toJson() -> [String: Any] {
    return [${this.child.map(e => `"${e.jsonKey}": _toJson(${e.prop})`).join(', ') || ':'}]
  }
}`;
  }
}

export class Simple extends Base.Simple<Complex> {
  lang = new Lang();
}
