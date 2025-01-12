import { func } from './func';
import { BaseType } from './type';
import { validate } from './schema';

export class Lang {
  keywords: Record<string, string> = {};

  arrayType(array: boolean[], type: string) {
    return '';
  }

  toProp(key: Key) {
    return '';
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
    return func.convertKeyword(this.key, this.lang.keywords, false);
  }

  get jsonKey() {
    return func.convertWrap(this.key);
  }

  toFromJson() {
    return `this.${this.prop} = _fromJson<${this.decl}>(_, '${this.jsonKey}', <bool>[${this.array}], ${this.optional}, this.${this.prop}, ${this.def}, opt);`;
  }
  abstract toDecl2Def(type?: string): { decl: string; def: string };
}

export abstract class Complex extends Key {
  private static refs = {
    data: {} as Record<string, Complex>,
    resolved: false,
    resolve(validate2?: typeof validate) {
      for (const path in Complex.refs.data) {
        const e = Complex.refs.data[path];
        if (!e || !e.parent) {
          continue;
        }
        const ref = (validate2 ?? validate)(e);
        if (!ref) {
          continue;
        }
        if (e.index === ref) {
          throw `禁止引用自身 ${ref}`;
        }
        const $ref = Complex.refs.data[ref];
        if (!$ref) {
          throw `引用地址 ${ref} 不存在`;
        }
        const i = e.parent.child.findIndex(ee => ee === e);
        if (i < 0) {
          continue;
        }
        e.parent.child[i] = $ref.clone(e);
      }
      Complex.refs.resolved = true;
    },
  };
  public static refsReset() {
    this.refs.data = {};
    this.refs.resolved = false;
  }
  public static refsValidate(validate2?: typeof validate) {
    this.refs.resolve = this.refs.resolve.bind(this, validate2);
  }

  private clone(self: typeof this) {
    let p = self.parent;
    let optional: boolean | undefined = undefined;
    if (!self.array.length) {
      const { decl } = this;
      while (p && optional === undefined) {
        if (p.decl === decl) {
          optional = true;
        }
        p = p.parent;
      }
    }
    return new (this as any).constructor(
      this.key,
      self.array,
      optional ?? self.optional,
      this.origin,
      this.parent,
      self,
    );
  }

  get index(): string {
    return `${this.parent ? this.parent.index : ''}/${this.key}`;
  }

  get prop() {
    return func.convertKeyword(this.$ref?.key ?? this.key, this.lang.keywords, false);
  }

  get jsonKey() {
    return func.convertWrap(this.$ref?.key ?? this.key);
  }

  protected constructor(
    public key: string,
    public array: boolean[],
    public optional: boolean,
    public origin: any,
    parent?: Complex,
    private $ref?: Complex,
  ) {
    super();
    this.parent = parent as typeof this;

    if ($ref) {
      return;
    }
    const index = this.index;
    if (Complex.refs.data[index]) {
      throw `生成的类型已经存在 ${index}`;
    }
    if (Complex.refs.resolved) {
      throw '不应该发生';
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
    const decl = `${this.parent?.decl ?? ''}${super.prop}` as string;
    return { decl, def: `new ${decl}()` };
  }

  toCode() {
    if (!Complex.refs.resolved) {
      Complex.refs.resolve();
    }
    if (this.$ref) {
      return [];
    }
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
    return this.child.find(e => e.key === key && (C === null || e instanceof (C ? Complex : Simple)));
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
    return this.toDecl2Def(this.type).decl;
  }
  get def() {
    return this.toDecl2Def(this.type).def;
  }

  abstract get baseDef(): Record<BaseType, { decl: string; def: string }>;
  toDecl2Def(type: BaseType) {
    return this.baseDef[type];
  }
}
