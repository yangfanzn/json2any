import { Json2classBase } from 'json2class';
import * as Base from './base';
import * as Dart from './dart';

type X = typeof Base.Http<Json2classBase.Complex, Json2classBase.Simple<Json2classBase.Complex>>;
type Y = Base.Http<Json2classBase.Complex, Json2classBase.Simple<Json2classBase.Complex>>;
export function json2http(): X;
export function json2http(key: string, json: Record<string, any>, file?: string): Y;
export function json2http(key?: string, json?: Record<string, any>, file?: string): X | Y {
  switch (Base.env.language) {
    case Base.Language.Dart3:
      return key && json ? Base.func.core2http(Dart.Http, Dart.Complex, Dart.Simple, key, json, file) : Dart.Http;
    // case Base.Language.ArkTs5:
    //   Base.func.assertError('Looking forward to it');
    //   throw 0;
  }
}
