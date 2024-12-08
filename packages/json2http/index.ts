import { Supported, SchemaTs } from './src/base';

import * as Base from './src/base';
import * as Dart from './src/dart';

export * as Base from './src/base';
export * as Dart from './src/dart';

export default function json2http(type: Supported, key: string, json: SchemaTs) {
  switch (type) {
    case Supported.Dart:
      return Dart.func.core2http(Dart.Http, Dart.Complex, Dart.Simple, key, json);
  }
}
