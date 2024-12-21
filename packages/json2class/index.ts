import { Supported } from './src/base';

import * as Base from './src/base';
import * as Dart from './src/dart';

export * as Base from './src/base';
export * as Dart from './src/dart';

export default function json2class(type: Supported, key: string, json: any) {
  switch (type) {
    case Supported.Dart:
      return Base.Func.core2class(Dart.Complex, Dart.Simple, key, json);
  }
}
