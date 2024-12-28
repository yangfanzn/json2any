import * as Json2HttpBase from './src/base';
import * as Json2HttpDart from './src/dart';

export * as Json2HttpBase from './src/base';
export * as Json2HttpDart from './src/dart';

export default function json2http(type: Json2HttpBase.Supported, key: string, json: Json2HttpBase.SchemaTs) {
  switch (type) {
    case Json2HttpBase.Supported.Dart:
      return {
        Http: Json2HttpDart.Http,
        http: Json2HttpBase.func.core2http(Json2HttpDart.Http, Json2HttpDart.Complex, Json2HttpDart.Simple, key, json),
      };
  }
}
