import * as Base from './src/base';
import * as Dart from './src/dart';

export * from './src/base';

export default function json2class(type: typeof Base.supported[number], name: string, json: any) {
  switch (type) {
    case 'dart':
      return Dart.fun.core(Dart.C, Dart.S, name, json);
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
