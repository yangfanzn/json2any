import * as Dart from './src/dart';
import * as Base from './src/base';

export * from './src/base';

export default function json2http(type: typeof Base.supported[number], json: any) {
  switch (type) {
    case 'dart':
      return Dart.fun.core(Dart.C, json);
  }
  throw '123';
}

export function tools(type: typeof Base.supported[number]) {
  switch (type) {
    case 'dart':
      return Dart.fun;
  }
  throw '123';
}
