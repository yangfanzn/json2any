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
  ArkTs12 = 'arkTs@12',
  Typescript5 = 'typescript@5',
  Kotlin2 = 'kotlin@2',
}

export abstract class Err extends Error {
  inner = true;
}

export class UnreachableError extends Err {
  constructor(public message: string) {
    super();
  }
  toString() {
    return this.message;
  }
}

export class AssertError extends Err {
  constructor(public message: string) {
    super();
  }
  toString() {
    return this.message;
  }
}

export const env = {
  version: '',
  author: '',
  debug: false,
  language: Language.Dart3,
  search: '',
};
