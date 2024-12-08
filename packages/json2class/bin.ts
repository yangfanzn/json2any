import { Supported } from './src/base';

import * as Base from './src/base/bin';
import * as Dart from './src/dart/bin';

export * as Base from './src/base/bin';
export * as Dart from './src/dart/bin';

export function tools(type: Supported) {
  switch (type) {
    case Supported.Dart:
      return Dart.bin;
  }
}
