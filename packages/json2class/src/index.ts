import * as Base from './base';
import * as Dart from './dart';

export function json2class(key: string, json: any) {
  switch (Base.env.language) {
    case Base.Language.Dart3:
      return Base.func.core2class(Dart.Complex, Dart.Simple, key, json);
    // case Base.Language.ArkTs5:
    //   Base.func.assertError('Looking forward to it');
    //   throw 0;
  }
}
