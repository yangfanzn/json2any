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

  get nameClass(): string {
    // todo: 不同语言，这个前缀可以不一样，单独可配置
    return `${this.parent?.nameClass ?? ''}${func.convertKeyword(this.key, '_', false)}`;
  }

  get nameProp() {
    return func.convertKeyword(this.key, '_', false);
  }
}

export abstract class Complex extends Key {
  child: (Complex | Simple)[] = [];
  protected constructor(
    public key: string,
    public array: boolean[],
    public optional: boolean,
    public origin: string,
    public parent?: Complex,
  ) {
    super();
  }

  abstract toCode(): { context: Complex; code: string }[];
  abstract toCreate(): string;
}

export abstract class Simple extends Key {
  abstract toDefVal(x: BaseType): { type: string; value: string };

  child = undefined;
  protected constructor(
    public key: string,
    public array: boolean[],
    public optional: boolean,
    public origin: string,
    public parent: Complex,
    public type: BaseType,
  ) {
    super();
  }
}

export interface InterKey {
  arrayType(array: boolean[], type: string): string;
  toFiles(jsons: Map<string, string>, type?: Supported): Map<string, string>;
}

export enum BaseType {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
}

export enum Supported {
  Dart = 'dart',
}
