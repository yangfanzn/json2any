import * as Json2classBase from './src/base';
import * as Json2classDart from './src/dart';

export * as Json2classBase from './src/base';
export * as Json2classDart from './src/dart';

export default function json2class(type: Json2classBase.Supported, key: string, json: any) {
  switch (type) {
    case Json2classBase.Supported.Dart:
      return Json2classBase.func.core2class(Json2classDart.Complex, Json2classDart.Simple, key, json);
  }
}
