import * as Base from './base';
import * as Dart from './dart';
import * as ArkTs from './arkTs';

export function json2class(key: string, json: Record<string, any>) {
  switch (Base.env.language) {
    case Base.Language.Dart3:
      return Base.func.core2class(Dart.Complex, Dart.Simple, key, json);
    case Base.Language.ArkTs0:
      return Base.func.core2class(ArkTs.Complex, ArkTs.Simple, key, json);
  }
}
