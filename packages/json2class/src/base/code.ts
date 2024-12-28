import { func } from './func';
import { BaseType } from './type';

export class Lang {
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
  abstract origin: string;
  abstract decl: string;
  abstract def: string;

  lang = new Lang();

  child?: Key[];
  parent?: Key;

  get prop() {
    return func.convertKeyword(this.key, '_', false);
  }

  toFromJson() {
    return `${this.prop} = _fromJson<${this.decl}>(_, '${this.prop}', <bool>[${this.array}], ${this.optional}, ${this.prop}, ${this.def}, opt);`;
  }
  abstract toDecl2Def(type?: string): { decl: string; def: string };
}

export abstract class Complex extends Key {
  protected constructor(
    public key: string,
    public array: boolean[],
    public optional: boolean,
    public origin: string,
    parent?: Complex,
  ) {
    super();
    this.parent = parent as typeof this;
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
    const decl = `${this.parent?.decl ?? ''}${this.prop}` as string;
    return { decl, def: `new ${decl}()` };
  }

  toCode() {
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

  getChildByKey(key: string) {
    return this.child.find(e => e.key === key);
  }
}

export abstract class Simple<C extends Complex> extends Key {
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
