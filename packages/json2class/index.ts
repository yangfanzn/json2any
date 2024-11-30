import * as Base from './src/base';
import * as Dart from './src/dart';

export * from './src/base';

export default function json2class(type: Base.Supported, key: string, json: any) {
  switch (type) {
    case Base.Supported.Dart:
      return Dart.func.core(Dart.Complex, Dart.Simple, key, json);
  }
}

export function tools(type: Base.Supported) {
  switch (type) {
    case Base.Supported.Dart:
      return Dart.func;
  }
}
