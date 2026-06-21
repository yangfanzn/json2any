import { Complex, Simple } from './code';
import { JsonType, UnreachableError, AssertError, Language, env } from './type';

export class Func {
  core2class(
    complex: typeof Complex,
    simple: typeof Simple<Complex>,
    key: string,
    json: Record<string, any>,
    parent?: Complex,
    file?: string,
  ): Complex;
  core2class(
    complex: typeof Complex,
    simple: typeof Simple<Complex>,
    key: string,
    json: Record<string, any>,
    parent: Complex,
  ): Complex | Simple<Complex>;
  core2class(
    complex: typeof Complex,
    simple: typeof Simple<Complex>,
    key: string,
    json: Record<string, any>,
    parent?: Complex,
    file?: string,
  ): Complex | Simple<Complex> | undefined {
    // json2class: key is file
    file = file ?? key;

    const array: boolean[] = [];
    while (Array.isArray(json)) {
      // retrieve index 1 first, then overwrite with index 0
      // note that reversing this order will cause issues
      array.push(json[1] === null);
      json = json[0];
    }

    const optional = key.endsWith('?');
    key = optional ? key.slice(0, -1) : key;

    const type = this.type(json);
    switch (type) {
      case JsonType.String:
      case JsonType.Number:
      case JsonType.Boolean:
        if (!parent) {
          this.unreachableError('simple must have a parent type', [key, file]);
        }
        // @ts-ignore
        return new simple(key, array, optional, json, parent, type);

      case JsonType.Object:
        // @ts-ignore
        const self = new complex(key, array, optional, json, parent, file);
        self.child = Object.keys(json)
          .map(k => this.core2class(complex, simple, k, json[k], self, file))
          .filter(e => e);
        return self;

      case JsonType.Null:
      case JsonType.Undefined:
        break;

      default:
        this.unreachableError(`core2class parsed an unknown typeof [${type}]`);
    }

    return undefined;
  }

  convertWrap(str: string) {
    const special: Record<string, string> = {
      // characters that may cause line breaks
      '\n': '\\n',
      '\r': '\\r',
      '\f': '\\f',
      '\v': '\\v',
      '\b': '\\b',
      '\t': '\\t',
      '\\': '\\\\',
      $: '\\$',
      "'": "\\'",
    };
    if (env.language === Language.Kotlin1_3) {
      special['"'] = '\\"';
      special['$'] = '${"$"}';
      special['\v'] = '\\\\v';
      special['\f'] = '\\\\f';
      str = str.replace(/\\u000b/g, '\\\\v').replace(/\\f/g, '\\\\f');
    }
    if (env.language === Language.Swift5_7) {
      special['"'] = '\\"';
      special['$'] = '$';
      // swift does not need special handling for the $ character because it does not have string interpolation conflicts like Kotlin
      // but other escape characters need to be handled
      special['\v'] = '\\\\v';
      special['\f'] = '\\\\f';
      special['\b'] = '\\\\b';
      str = str
        .replace(/\\u000b/g, '\\\\v')
        .replace(/\\f/g, '\\\\f')
        .replace(/\\b/g, '\\\\b');
    }
    return str.replace(new RegExp(`[${Object.keys(special).join('')}\\\\]`, 'g'), e => {
      const t = special[e];
      if (t) {
        return t;
      }
      return this.unreachableError('convertWrap');
    });
  }

  quickHash(str: string, max: number) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) % Math.pow(10, max);
    }
    return hash.toString().padStart(max, '0');
  }

  convertKeyword(str: string, keywords: Record<string, string>, restore: boolean) {
    const max = 3;
    const splitKey = '_';
    const startKey = 'k';

    if (!restore) {
      if (keywords[str]) {
        return `${startKey}${this.quickHash(str, max)}${str}`;
      }
      let [, x] = str.match(new RegExp('^(\\d)')) ?? [];
      x = x ? `${splitKey}${x.charCodeAt(0)}${splitKey}` : '';
      x = `${x}${str.slice(x ? 1 : 0).replace(/[^a-zA-Z0-9_]/g, e => `${splitKey}${e.charCodeAt(0)}${splitKey}`)}`;
      if (x.startsWith('_')) {
        x = `${startKey}${this.quickHash(str, max)}${x}`;
      }
      return x;
    }

    const x = str.replace(new RegExp(`${splitKey}(\\d+)${splitKey}`, 'g'), (_, e) => String.fromCharCode(e));
    const [, hash] = x.match(new RegExp(`^${startKey}(\\d{${max})`)) ?? [];
    if (hash) {
      const t = x.slice(max + 1);
      return hash === this.quickHash(t, max) ? t : x;
    }

    // quickHash must be used. Keywords also need a leading prefix, not only names that start with '_'.
    // With 3 digits, quickHash chance of collision for a 10-char string is only 0.5%.
    // This 0.5% can happen only when using restore. One-way conversion is safe.
    this.unreachableError('convertKeyword restore can not be used');
    return x;
  }

  addX(child: string) {
    return `${String.fromCharCode(60)}${child}${String.fromCharCode(62)}`;
  }

  toUpperCaseFirst(str: string) {
    if (str.length) {
      return `${str.substring(0, 1).toUpperCase()}${str.substring(1)}`;
    } else {
      return str;
    }
  }

  clearComment(str: string) {
    return str.replace(/\s*\/\/.*$/gm, '').replace(/^\s*\n/gm, '');
  }

  addCopyRight(tool: 'json2class' | 'json2http') {
    return `
/**
 * Version: ${env.version}
 * Licensed under the ISC License. See LICENSE file for details.
 * Copyright (c) 2024-present ${env.author}, China
 * This file is auto-generated by [${tool}].
 * Do not modify this file manually, as changes will be overwritten.
 */
 
`;
  }

  type(o: any) {
    return Object.prototype.toString.call(o).slice(8, -1).toLowerCase();
  }
  typeIsObject(o: unknown): o is Record<string, any> {
    return this.type(o) === JsonType.Object;
  }

  private errorFormat(detail?: (string | undefined)[] | Complex) {
    const list: (string | undefined)[] = [];
    if (detail) {
      if (detail instanceof Complex) {
        detail.file && list.push(`file: ${env.search}${detail.file}.json(5)`);
        list.push(`index: ${detail.index}`);
        try {
          // circular reference may occur
          list.push(`class: ${detail.decl}`);
        } catch (e) {}
      } else {
        list.push(...detail.filter(Boolean));
      }
    }
    return list;
  }

  unreachableError(message: string, detail?: (string | undefined)[] | Complex): never {
    const list: (string | undefined)[] = [message];
    list.push(...this.errorFormat(detail));
    list.push(
      ...[
        `in version ${env.version}, the occurrence of this error indicates an unexpected situation in the program`,
        `please add --debug option and report the error to the author ${env.author}. Thank you very much!`,
      ],
    );
    throw new UnreachableError(list.join('\n'));
  }

  assertError(message: string, detail?: (string | undefined)[] | Complex): never {
    const list: (string | undefined)[] = [message];
    list.push(...this.errorFormat(detail));
    throw new AssertError(list.join('\n'));
  }

  language(language: Language) {
    const languages: Record<Language, { ext: string; temp: string; language: string; version?: string }> = {
      [Language.Dart3]: {
        ext: 'dart',
        temp: require('../dart/temp.dart').default,
        language: 'dart',
        version: '3',
      },
      [Language.ArkTs12]: {
        ext: 'ets',
        temp: require('../arkTs/temp.ets.ts').default,
        language: 'arkTs',
        version: '12',
      },
      [Language.Typescript5]: {
        ext: 'ts',
        temp: require('../arkTs/temp.ets.ts').default,
        language: 'typescript',
        version: '5',
      },
      [Language.Kotlin1_3]: {
        ext: 'kt',
        temp: require('../kotlin/temp.kt').default,
        language: 'kotlin',
        version: '1.3',
      },
      [Language.Swift5_7]: {
        ext: 'swift',
        temp: require('../swift/temp.swift').default,
        language: 'swift',
        version: '5.7',
      },
    };
    return languages[language];
  }

  unique() {
    return `unique_${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  }
}

export const func = new Func();
