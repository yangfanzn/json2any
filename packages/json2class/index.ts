import * as Json2classBase from './src/base';
import * as Json2classDart from './src/dart';

export * as Json2classBase from './src/base';
export * as Json2classDart from './src/dart';

export default function json2class(key: string, json: any) {
  switch (Json2classBase.func.envJson2class.language) {
    case Json2classBase.Language.Dart3:
      return Json2classBase.func.core2class(Json2classDart.Complex, Json2classDart.Simple, key, json);
    // case Json2classBase.Language.ArkTs5:
    //   Json2classBase.func.assertError('Looking forward to it');
    //   throw 0;
  }
}
