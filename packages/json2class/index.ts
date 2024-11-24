import * as Dart from './src/dart';
export { bin } from './src/bin';

export default function json2class(name: string, json: any, type: 'dart') {
  switch (type) {
    case 'dart':
      // todo: json2type -> core
      return Dart.fun.json2type(Dart.C, Dart.S, name, json);
  }
  throw '123';
}
