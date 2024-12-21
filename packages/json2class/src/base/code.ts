import { Func } from './func';

export abstract class Key {
  abstract key: string;
  abstract array: boolean[];
  abstract optional: boolean;
  abstract origin: string;
  abstract decl: string;
  abstract def: string;

  child?: Key[];
  parent?: Key;

  get prop() {
    return Func.convertKeyword(this.key, '_', false);
  }

  // todo: 导出的 class 不能在 import 时 as，否则这里就没有继承标记
  toFromJson() {
    return `${this.prop} = _fromJson<${this.decl}>(_, '${this.prop}', <bool>[${this.array}], ${this.optional}, ${this.prop}, ${this.def}, opt);`;
  }
  abstract toDecl2Def(type?: string): { decl: string; def: string };
}

export abstract class Complex<S extends Key = Simple<Key>> extends Key {
  protected constructor(
    public key: string,
    public array: boolean[],
    public optional: boolean,
    public origin: string,
    parent?: Complex<S>,
  ) {
    super();
    this.parent = parent as typeof this;
  }

  child: (typeof this | S)[] = [];
  parent: typeof this;

  get decl() {
    return this.toDecl2Def().decl;
  }
  get def() {
    return this.toDecl2Def().def;
  }

  toDecl2Def() {
    const decl = `${this.parent?.decl ?? ''}${this.prop}` as string;
    return { decl, def: `new ${decl}()` };
  }

  toCode() {
    const x = this as typeof this;
    return [] as { context: typeof x; code: string }[];
  }

  getChildByKey(key: string) {
    return this.child.find(e => e.key === key);
  }
}

export abstract class Simple<C extends Key = Complex<Key>> extends Key {
  protected constructor(
    public key: string,
    public array: boolean[],
    public optional: boolean,
    public origin: string,
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

  abstract toDecl2Def(type: BaseType): { decl: string; def: string };
}

export enum BaseType {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
}

export enum Supported {
  Dart = 'dart',
}
