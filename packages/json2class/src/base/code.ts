import { func } from './func';
import { validate } from './schema';
import { BaseType, JsonType } from './type';

export class Lang {
  keywords: Record<string, string> = {};

  baseDef = {
    [BaseType.String]: { decl: 'String', def: "''" },
    [BaseType.Number]: { decl: 'num', def: '0' },
    [BaseType.Boolean]: { decl: 'bool', def: 'false' },
  };

  arrayValue(value: boolean[]) {
    return `${func.addX('bool')}[${value}]`;
  }

  arrayType(array: boolean[], type: string): string {
    return array.reduce((v, e) => {
      return `List${func.addX(`${v}${e ? '?' : ''}`)}`;
    }, type);
  }

  toProp(key: Key) {
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

  toFromJson(key: Key) {
    return `this.${key.prop} = this._fromJson<${key.decl}>(data, '${key.jsonKey}', ${this.arrayValue(key.array)}, ${
      key.optional
    }, this.${key.prop}, ${key.def}, r);`;
  }
}

export abstract class Key {
  abstract key: string;
  abstract array: boolean[];
  abstract optional: boolean;
  abstract origin: any;
  abstract decl: string;
  abstract def: string;

  lang = new Lang();

  child?: Key[];
  parent?: Key;

  get prop() {
    let key = this.key;
    if (!this.parent) {
      // no parent, is complex, and is top.
      // remove the '/' and concatenate directly.
      // consistent with the way nested objects are concatenated.
      // '/' in json key are properly escaped.
      key = key.replace(/\//g, '');
    }
    return func.convertKeyword(key, this.lang.keywords, false);
  }

  get jsonKey() {
    return func.convertWrap(this.key);
  }

  abstract toDecl2Def(type?: string): { decl: string; def: string };

  getRoot() {
    let p = this.parent;
    while (p?.parent) {
      p = p.parent;
    }
    return p ?? this;
  }
}

export abstract class Complex extends Key {
  private static origin2preset(origin: Record<string, any>, keys: string[], rootKey?: string) {
    return Object.keys(origin).reduce<Record<string, any>>((preset, key) => {
      const rKey = `${(rootKey ?? key).split('#').shift()}#`;
      const k = key.endsWith('?') ? key.slice(0, -1) : key;

      let item = preset[key];
      const array: boolean[] = [];
      while (Array.isArray(item)) {
        if (item[1] === null) {
          item.splice(1, 1);
        }
        array.push(true);
        item = item[0];
      }

      let resolved;
      if (item && item['$meta'] && item['$meta'].ref) {
        let ref: string = item['$meta'].ref;
        ref = ref.startsWith('/') ? ref : `${rKey}${ref.slice(1)}`;

        // must use stringify to get new object, or test12 has cross-reference issue occurs
        const refVal = JSON.parse(JSON.stringify(this.refs.origin[ref]));

        if (!refVal) {
          func.unreachableError('reference search for type entity failed', [ref]);
        }

        if (keys.includes(ref)) {
          // resolved = null;
        } else {
          const x = `k${Date.now()}`;
          const y = `${ref.split('#').shift()}#`;
          resolved = this.origin2preset({ [x]: refVal }, [...keys, ref], y)[x];
        }
      } else {
        resolved = func.type(item) === JsonType.Object ? this.origin2preset(item, [...keys], rKey) : item;
      }

      // use eval for quick reference array index data
      eval(`preset[key]${array.map(e => `[0]`).join('')} = resolved;`);

      if (key !== k) {
        switch (func.type(preset[key])) {
          case JsonType.Object:
            preset[k] = { ...preset[key] };
            break;
          case JsonType.Array:
            preset[k] = [...preset[key]];
            break;
          default:
            preset[k] = preset[key];
        }
        // must mark new data can be deleted
        delete preset[key];
      }

      if (resolved === undefined) {
        if (array.length) {
          array.pop();
          eval(`preset[k]${array.map(e => `[0]`).join('')}.splice(0,1);`);
        } else {
          eval('delete preset[k];');
        }
      }

      return preset;
    }, origin);
  }

  private static refs = {
    unique: {} as Record<string, true>,
    index: {} as Record<string, Complex>,
    origin: {} as Record<string, any>,
    preset: {} as Record<string, any>,
    resolved: false,
  };

  public static refsReset() {
    this.refs.unique = {};
    this.refs.index = {};
    this.refs.origin = {};
    this.refs.preset = {};
    this.refs.resolved = false;
  }
  public static refsResolve() {
    if (this.refs.resolved) {
      return;
    } else {
      this.refs.resolved = true;
    }

    const origin: Record<string, any> = {};
    const optional: Complex[] = [];

    for (const index in this.refs.index) {
      const e = this.refs.index[index];
      if (!e) {
        // just for static type check
        continue;
      }

      // search root origin to parse preset
      if (!e.parent) {
        const { index } = e;
        origin[index] = this.refs.origin[index];
        if (!origin[index]) {
          return func.unreachableError('reference search for complex.origin failed', e);
        }
      }

      const refIndex = validate(e);
      if (!refIndex) {
        continue;
      }
      const ref = this.refs.index[refIndex];
      if (!ref) {
        return func.assertError('the reference address does not exist', e);
      }

      e.ref = ref;
      optional.push(e);
    }

    // get all relation real class by ref, to avoid instantiation deadlock
    const relation = (c: Complex, cs: Complex[]) => {
      c = c.getReal();
      return c.child
        .filter(e => e instanceof Complex)
        .reduce<Complex[]>(
          (a, e) => {
            if (!cs.includes(e)) {
              a.push(...relation(e, [...cs, e]));
            }
            return a;
          },
          [c],
        );
    };

    // get ref optional, to avoid instantiation deadlock
    optional.forEach(e => {
      let p = e.parent;
      const decls = relation(e, []).map(e => e.decl);
      if (!e.array.length) {
        while (p) {
          if (decls.includes(p.decl)) {
            e.optional = true;
            break;
          }
          p = p.parent;
        }
      }
    });

    // root preset resolved
    // must use stringify to get new object, or inner origin2preset use this.refs.origin will issue occurs
    this.refs.preset = this.origin2preset(JSON.parse(JSON.stringify(this.refs.origin)), []);

    // set preset complex
    for (const index in this.refs.index) {
      const e = this.refs.index[index];
      if (!e) {
        // just for static type check
        continue;
      }
      const preset = this.refs.preset[index];
      if (!preset) {
        func.unreachableError('reference search for complex.preset failed', e);
      }
      e.preset = preset;
    }
  }

  private ref?: typeof this;

  get index(): string {
    return `${this.parent ? `${this.parent.index}/` : ''}${this.key}${this.parent ? '' : '#'}`;
  }

  protected constructor(
    public key: string,
    public array: boolean[],
    public optional: boolean,
    public origin: Record<string, any>,
    parent?: Complex,
    public file?: string,
  ) {
    super();

    if (Complex.refs.resolved) {
      func.unreachableError('refs has been resolved', this);
    }

    this.parent = parent as typeof this;

    const { index, decl } = this;

    if (Complex.refs.index[index]) {
      func.assertError('the ref index already exists', this);
    } else {
      Complex.refs.index[index] = this;
    }

    if (Complex.refs.unique[decl]) {
      func.assertError('the class name already exists', this);
    } else {
      Complex.refs.unique[decl] = true;
    }

    // JSON.stringify to deep copy
    Complex.refs.origin[index] = JSON.parse(JSON.stringify(this.origin));
  }

  child: (typeof this | Simple<typeof this>)[] = [];
  parent?: typeof this;

  // late set by refsResolve
  preset: Record<string, any> = {};

  abstract toClass(): string;

  get decl() {
    return this.toDecl2Def().decl;
  }
  get def() {
    return this.toDecl2Def().def;
  }

  toDecl2Def() {
    const self = this.getReal();
    const decl = `${self.parent?.decl ?? ''}${self.prop}` as string;
    return { decl, def: `new ${decl}()` };
  }

  private coded = false;
  toCode() {
    Complex.refsResolve();

    if (this.ref) {
      return [];
    }

    if (this.coded) {
      return [];
    }
    this.coded = true;

    return this.child
      .filter(e => e instanceof Complex)
      .reduce(
        (codes, cur) => {
          codes.push(...cur.toCode());
          return codes;
        },
        [{ context: this as typeof this, code: this.toClass() }],
      );
  }

  getChildByKey(key: string, real: boolean, C: false): Simple<typeof this> | undefined;
  getChildByKey(key: string, real: boolean, C: true): typeof this | undefined;
  getChildByKey(key: string, real: boolean, C: null): typeof this | Simple<typeof this> | undefined;
  getChildByKey(key: string, real: boolean, C: boolean | null): typeof this | Simple<typeof this> | undefined {
    let t = this.child.find(e => e.key === key && (C === null || e instanceof (C ? Complex : Simple)));
    if (t instanceof Complex && real) {
      t = t.getReal();
    }
    return t;
  }

  getReal() {
    let t = this;
    while (t.ref) {
      t = t.ref;
      if (this === t) {
        func.assertError('circular reference error', t);
      }
    }
    return t;
  }
}

export abstract class Simple<C extends Complex> extends Key {
  protected constructor(
    public key: string,
    public array: boolean[],
    public optional: boolean,
    public origin: string | number | boolean,
    public parent: C,
    public type: BaseType,
  ) {
    super();
  }

  child = undefined;

  get decl() {
    return this.toDecl2Def().decl;
  }
  get def() {
    return this.toDecl2Def().def;
  }

  toDecl2Def() {
    return this.lang.baseDef[this.type];
  }
}
