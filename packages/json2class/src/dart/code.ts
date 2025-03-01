import * as Base from '../base';
import { keywords } from './keywords';

export class Lang extends Base.Lang {
  keywords = keywords;

  baseDef = {
    [Base.BaseType.String]: { decl: 'String', def: "''" },
    [Base.BaseType.Number]: { decl: 'num', def: '0' },
    [Base.BaseType.Boolean]: { decl: 'bool', def: 'false' },
  };

  arrayValue(value: boolean[], typedef?: Record<string, string>) {
    const declBool = typedef?.['bool'] ?? 'bool';
    return `${Base.func.addX(declBool)}[${value}]`;
  }

  arrayType(array: boolean[], type: string): string {
    return array.reduce((v, e) => {
      return `List${Base.func.addX(`${v}${e ? '?' : ''}`)}`;
    }, type);
  }

  toProp(key: Base.Key, typedef?: Record<string, string>) {
    const decl = typedef?.[key.decl] ?? key.decl;
    const def = key instanceof Base.Complex ? `new ${decl}()` : key.def;
    if (key.array.length) {
      if (key.optional) {
        return `${this.arrayType(key.array, decl)}? ${key.prop};`;
      } else {
        return `${this.arrayType(key.array, decl)} ${key.prop} = [];`;
      }
    } else {
      if (key.optional) {
        return `${decl}? ${key.prop};`;
      } else {
        return `${decl} ${key.prop} = ${def};`;
      }
    }
  }

  toFromJson(key: Base.Key, typedef?: Record<string, string>) {
    const decl = typedef?.[key.decl] ?? key.decl;
    const def = key instanceof Base.Complex ? `new ${decl}()` : key.def;
    return `this.${key.prop} = this._fromJson<${decl}>(data, '${key.jsonKey}', ${this.arrayValue(
      key.array,
      typedef,
    )}, ${key.optional}, this.${key.prop}, ${def}, r);`;
  }
}

export class Complex extends Base.Complex {
  lang = new Lang();

  toClass() {
    // In Dart, this can be omitted in context,
    // which may cause conflicts when defining properties
    // if a property name is the same as the type name of another property in the same class.
    // This type of conflict is not a keyword conflict but a special conflict scenario in Dart.
    const { keys, decls } = this.child.reduce(
      (a, e) => {
        a.keys.push(e.key);
        a.decls.push(e.decl);
        return a;
      },
      // preset => String 、 toJson => Map
      // they are both attributes and also need to be converted
      { keys: [] as string[], decls: ['String', 'Map'] as string[] },
    );
    // Use typedef to define an alias for a type to avoid naming conflicts caused by omitting this in Dart
    // This data will be passed to the toProp and toFromJson functions for use.
    const typedef = keys.reduce((a, e) => {
      if (decls.includes(e)) {
        a[e] = `_${e}_${Base.func.unique()}`;
      }
      return a;
    }, {} as Record<string, string>);

    const declString = typedef['String'] ?? 'String';
    const declMap = typedef['Map'] ?? 'Map';
    return `
${Object.keys(typedef)
  .map(k => {
    const generic = k === 'Map' ? Base.func.addX('A,B') : '';
    return `typedef ${typedef[k]}${generic} = ${k}${generic};`;
  })
  .join('')}
class ${this.decl} extends Json2class {
  ${this.child.map(e => this.lang.toProp(e, typedef)).join('')}
  ${declString} preset = '${Base.func.convertWrap(JSON.stringify(this.preset))}';
  ${this.decl} fromJson(dynamic data, {void Function(Rule rule)? setRule, Rule? rule}) {
    final r = (rule ?? this.rule ?? Json2class.defaultRule).copy(); setRule?.call(r);
    ${this.child.map(e => e.lang.toFromJson(e, typedef)).join('')}
    return this;
  }
  toNew() => ${this.def};
  ${declMap}${Base.func.addX(`${declString}, dynamic`)} toJson() {
    return {${this.child.map(e => `'${e.jsonKey}':_toJson(${e.prop})`)}};
  }
}`;
  }
}

export class Simple extends Base.Simple<Complex> {
  lang = new Lang();
}
