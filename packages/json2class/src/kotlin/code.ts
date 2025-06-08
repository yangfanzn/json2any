import * as Base from '../base';
import { keywords } from './keywords';

export class Lang extends Base.Lang {
  keywords = keywords;

  baseDef = {
    [Base.BaseType.String]: { decl: 'String', def: '""' },
    [Base.BaseType.Number]: { decl: 'Number', def: '0' },
    [Base.BaseType.Boolean]: { decl: 'Boolean', def: 'false' },
  };

  arrayValue(value: boolean[]): string {
    return `listOf(${value})`;
  }

  arrayType(array: boolean[], type: string): string {
    return array.reduce((v, e) => {
      return `MutableList${Base.func.addX(`${v}${e ? '?' : ''}`)}`;
    }, type);
  }

  toProp(key: Base.Key) {
    if (key.array.length) {
      if (key.optional) {
        return `var ${key.prop}: ${this.arrayType(key.array, key.decl)}? = null;`;
      } else {
        return `var ${key.prop}: ${this.arrayType(key.array, key.decl)} = mutableListOf();`;
      }
    } else {
      if (key.optional) {
        return `var ${key.prop}: ${key.decl}? = null;`;
      } else {
        return `var ${key.prop}: ${key.decl} = ${key.def};`;
      }
    }
  }

  toFromJson(key: Base.Key): string {
    return super.toFromJson(key).replace(/;$/, `as ${this.arrayType(key.array, key.decl)}${key.optional ? '?' : ''};`);
  }
}

export class Complex extends Base.Complex {
  lang = new Lang();

  toDecl2Def() {
    const { decl, def } = super.toDecl2Def();
    return { decl, def: def.slice(4) };
  }

  toClass() {
    return `
class ${this.decl} : Json2class() {
  ${this.child.map(e => this.lang.toProp(e)).join('')}
  override var preset = "${Base.func.convertWrap(JSON.stringify(this.preset))}"
  override fun fromJson(data: Any?, setRule: ((Rule) -> Unit)?, rule: Rule?): ${this.decl} {
    val r = (rule ?: this.rule ?: defaultRule).copy(); setRule?.invoke(r)
    ${this.child.map(e => e.lang.toFromJson(e)).join('')}
    return this
  }
  override fun toNew(): ${this.decl} {
    return ${this.def}
  }
  override fun toJson(): MutableMap${Base.func.addX('String, Any?')} {
    return mutableMapOf(${this.child.map(e => `"${e.jsonKey}" to _toJson(${e.prop})`)})
  }
}`;
  }
}

export class Simple extends Base.Simple<Complex> {
  lang = new Lang();
}
