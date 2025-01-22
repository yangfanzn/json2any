import * as Base from './base';
import * as Dart from './dart';

export function json2http(key: string, json: Record<string, any>) {
  switch (Base.env.language) {
    case Base.Language.Dart3:
      return {
        Http: Dart.Http,
        http: Base.func.core2http(Dart.Http, Dart.Complex, Dart.Simple, key, json),
      };
    // case Base.Language.ArkTs5:
    //   Base.func.assertError('Looking forward to it');
    //   throw 0;
  }
}
