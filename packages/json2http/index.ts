import * as Json2HttpBase from './src/base';
import * as Json2HttpDart from './src/dart';

export * as Json2HttpBase from './src/base';
export * as Json2HttpDart from './src/dart';

export * from 'json2class';

export default function json2http(key: string, json: any) {
  switch (Json2HttpBase.func.envJson2http.language) {
    case Json2HttpBase.Language.Dart3:
      return {
        Http: Json2HttpDart.Http,
        http: Json2HttpBase.func.core2http(Json2HttpDart.Http, Json2HttpDart.Complex, Json2HttpDart.Simple, key, json),
      };
    // case Json2HttpBase.Language.ArkTs5:
    //   Json2HttpBase.func.assertError('Looking forward to it');
    //   throw 0;
  }
}
