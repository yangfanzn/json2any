import { func } from './func';

export abstract class Key {
  abstract key: string;
  abstract array: boolean[];
  abstract origin: string;
  abstract optional: boolean;

  child?: Key[];
  parent?: Key;

  abstract toProp(): string;
  abstract toSet(): string;

  get nameProp() {
    return func.convertKeyword(this.key, '_', false);
  }
}

export abstract class Complex<S extends Key = Simple<Key>> extends Key {
  child: (typeof this | S)[] = [];
  parent: typeof this;

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

  get nameClass(): string {
    // todo: 不同语言，这个前缀可以不一样，单独可配置
    return `${this.parent?.nameClass ?? ''}${func.convertKeyword(this.key, '_', false)}`;
  }

  toCode() {
    const x = this as typeof this;
    return [] as { context: typeof x; code: string }[];
  }
  abstract toCreate(): string;
}

export abstract class Simple<C extends Key = Complex<Key>> extends Key {
  child = undefined;

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

  abstract toDefVal(x: BaseType): { type: string; value: string };
}

export interface InterKey {
  arrayType(array: boolean[], type: string): string;
  // 基类有实现的可以不必定义，如 toFiles
}

export enum BaseType {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
}

export enum Supported {
  Dart = 'dart',
}
