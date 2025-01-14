export enum JsonType {
  Undefined = 'undefined',
  Null = 'null',
  Array = 'array',
  Object = 'object',
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
}

export enum BaseType {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
}

export enum Language {
  Dart3 = 'dart@3',
  // ArkTs5 = 'arkTs@5',
}

export class UnreachableError extends Error {
  constructor(public message: string) {
    super();
  }
  toString() {
    return this.message;
  }
}

export class AssertError extends Error {
  constructor(public message: string) {
    super();
  }
  toString() {
    return this.message;
  }
}
