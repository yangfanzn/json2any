import { fun } from './fun';

abstract class _K {
  abstract key: string;
  abstract array: boolean[];
  abstract origin: string;
  abstract optional: boolean;

  child?: _K[];
  parent?: _K;

  abstract toProp(): string;
  abstract toSet(): string;

  get nameClass(): string {
    // todo: 不同语言，这个前缀可以不一样，单独可配置
    return `${this.parent?.nameClass ?? ''}${fun.convertKeyword(this.key, '_', false)}`;
  }

  get nameProp() {
    return fun.convertKeyword(this.key, '_', false);
  }
}

export abstract class _C extends _K {
  child: (_C | _S)[] = [];
  constructor(
    public key: string,
    public array: boolean[],
    public optional: boolean,
    public origin: string,
    public parent?: _C,
  ) {
    super();
  }

  abstract toClass(): string[];
  abstract toCreate(): string;
}

export enum _T {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
}

export abstract class _S extends _K {
  abstract toDefVal(x: _T): { type: string; value: string };

  child = undefined;
  constructor(
    public key: string,
    public array: boolean[],
    public optional: boolean,
    public origin: string,
    public parent: _C,
    public type: _T,
  ) {
    super();
  }
}

export abstract class _I {
  abstract arrayType(array: boolean[], type: string): string;
}
