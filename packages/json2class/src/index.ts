import * as Base from './base';
import * as Dart from './dart';
import * as ArkTs from './arkTs';
import * as Kotlin from './kotlin';
import * as Swift from './swift';

export function json2class(key: string, json: Record<string, any>) {
  switch (Base.env.language) {
    case Base.Language.Dart3:
      return Base.func.core2class(Dart.Complex, Dart.Simple, key, json);
    case Base.Language.ArkTs12:
    case Base.Language.Typescript5:
      return Base.func.core2class(ArkTs.Complex, ArkTs.Simple, key, json);
    case Base.Language.Kotlin1_3:
      return Base.func.core2class(Kotlin.Complex, Kotlin.Simple, key, json);
    case Base.Language.Swift5_7:
      return Base.func.core2class(Swift.Complex, Swift.Simple, key, json);
  }
}
