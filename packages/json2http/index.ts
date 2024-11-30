import * as Dart from './src/dart';
import * as Base from './src/base';

export * from './src/base';

export default function json2http(type: Base.Supported, key: string, json: Base.SchemaTs) {
  switch (type) {
    case Base.Supported.Dart:
      return Dart.func.core(Dart.Http, Dart.Complex, Dart.Simple, key, json);
  }
}

export function tools(type: Base.Supported) {
  switch (type) {
    case Base.Supported.Dart:
      return Dart.func;
  }
}
