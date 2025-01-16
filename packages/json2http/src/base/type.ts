import { Json2classBase } from 'json2class';

export enum Language {
  Dart3 = 'dart@3',
  // ArkTs5 = 'arkTs@5',
}

export enum DefaultAgent {
  Dart_Dio5 = 'dart_dio@5',
  // ArkTs_Http5 = 'arkTs_http@5',
}

const parent: string[] = Object.values(Json2classBase.Language);
Object.values(Language).forEach((e: string) => {
  if (!parent.includes(e)) {
    Json2classBase.func.unreachableError('enum Language');
  }
});
