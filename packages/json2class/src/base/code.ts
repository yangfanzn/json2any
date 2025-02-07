import { func } from './func';
import { validate } from './schema';
import { BaseType } from './type';

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
  private static refs = {
    data: {} as Record<string, Complex>,
    resolved: false,
  };
  public static refsReset() {
    this.refs.data = {};
    this.refs.resolved = false;
  }
  public static refsResolve() {
    if (this.refs.resolved) {
      return;
    }
    this.refs.resolved = true;

    const roots: Complex[] = [];
    for (const path in this.refs.data) {
      const e = this.refs.data[path];
      if (!e) {
        // just for static type check
        continue;
      }

      // search root for class name unique check
      if (!e.parent) {
        roots.push(e);
      }

      const index = validate(e);
      if (!index) {
        continue;
      }
      const ref = this.refs.data[index];
      if (!ref) {
        return func.assertError('the reference address does not exist', e);
      }
      e.refSet(ref);
    }

    // class name unique check
    const unique: Record<string, boolean> = {};
    for (const e of roots) {
      if (!e.ref) {
        if (unique[e.decl]) {
          func.assertError(`the class prefix already exists`, e);
        }
        unique[e.decl] = true;
      }
    }
  }

  private ref?: typeof this;
  private refSet(ref: typeof this) {
    this.ref = ref;
    let p = this.parent;
    if (!this.array.length) {
      const { decl } = ref;
      while (p) {
        if (p.decl === decl) {
          // avoid instantiation deadlock
          this.optional = true;
          break;
        }
        p = p.parent;
      }
    }
  }

  get index(): string {
    return `${this.parent ? `${this.parent.index}/` : ''}${this.key}${this.parent ? '' : '#'}`;
  }

  protected constructor(
    public key: string,
    public array: boolean[],
    public optional: boolean,
    public origin: any,
    parent?: Complex,
    public file?: string,
  ) {
    super();
    this.parent = parent as typeof this;

    const index = this.index;
    if (Complex.refs.data[index]) {
      func.assertError('the type structure already exists', this);
    }
    if (Complex.refs.resolved) {
      func.unreachableError('refs has been resolved', this);
    }
    Complex.refs.data[index] = this;
  }

  child: (typeof this | Simple<typeof this>)[] = [];
  parent?: typeof this;

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

  getChildByKey(key: string, C: false): Simple<typeof this> | undefined;
  getChildByKey(key: string, C: null): typeof this | Simple<typeof this> | undefined;
  getChildByKey(key: string, C?: true): typeof this | undefined;
  getChildByKey(key: string, C: boolean | null = true): typeof this | Simple<typeof this> | undefined {
    let t = this.child.find(e => e.key === key && (C === null || e instanceof (C ? Complex : Simple)));
    if (t instanceof Complex) {
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
    public origin: any,
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
