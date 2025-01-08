import { Complex, Simple } from './code';
import { JsonType } from './type';

export class Func {
  core2class(complex: typeof Complex, simple: typeof Simple<Complex>, key: string, json: any): Complex;
  core2class(
    complex: typeof Complex,
    simple: typeof Simple<Complex>,
    key: string,
    json: any,
    parent: Complex,
  ): Complex | Simple<Complex>;
  core2class(
    complex: typeof Complex,
    simple: typeof Simple<Complex>,
    key: string,
    json: any,
    parent?: Complex,
  ): Complex | Simple<Complex> | undefined {
    const array: boolean[] = [];
    while (Array.isArray(json)) {
      // 先取 1，再用 0 复写，注意反过来会有问题
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
          throw '简单类型必须有父类型';
        }
        // @ts-ignore
        return new simple(key, array, optional, json, parent, type);

      case JsonType.Object:
        // @ts-ignore
        const self = new complex(key, array, optional, json, parent);
        self.child = Object.keys(json)
          .map(k => this.core2class(complex, simple, k, json[k], self))
          .filter(e => e);
        return self;

      case JsonType.Null:
      // 配置的空数组，没有给数组元素
      case JsonType.Undefined:
        break;

      default:
        throw `不可能出现的错误 ${type}`;
    }

    return undefined;
  }

  convertWrap(str: string) {
    // 可能引发换行的字符
    const special: Record<string, string> = {
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
    return str.replace(new RegExp(`[${Object.keys(special).join('')}\\\\]`, 'g'), e => {
      const t = special[e];
      if (t) {
        return t;
      }
      throw '不可能发生';
    });
  }

  quickHash(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) % 100;
    }
    return hash.toString().padStart(2, '0');
  }

  convertKeyword(str: string, keywords: Record<string, string>, restore: boolean) {
    const splitKey = '_';
    const startKey = 'k';
    if (restore) {
      let x = str.replace(new RegExp(`${splitKey}(\\d+)${splitKey}`, 'g'), (_, e) => String.fromCharCode(e));
      const [, hash] = x.match(new RegExp(`^${startKey}(\\d{2})`)) ?? [];
      if (hash) {
        const t = x.slice(3);
        return hash === this.quickHash(t) ? t : x;
      }
      return x;
    } else {
      if (keywords[str]) {
        // todo: quickHash 总感觉不妥
        return `${startKey}${this.quickHash(str)}${str}`;
      }
      let [, x] = str.match(new RegExp('^(\\d)')) ?? [];
      x = x ? `${splitKey}${x.charCodeAt(0)}${splitKey}` : '';
      x = `${x}${str.slice(x ? 1 : 0).replace(/[^a-zA-Z0-9]/g, e => `${splitKey}${e.charCodeAt(0)}${splitKey}`)}`;
      if (x.startsWith('_')) {
        x = `${startKey}${this.quickHash(str)}${x}`;
      }
      return x;
    }
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

  type(o: any) {
    const t = Object.prototype.toString.call(o).slice(8, -1).toLowerCase() as JsonType;
    return Object.values(JsonType).includes(t) ? t : undefined;
  }
}

export const func = new Func();
