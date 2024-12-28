import { Complex, Key, Simple } from './code';

export abstract class Func {
  static core2class(complex: typeof Complex, simple: typeof Simple, key: string, json: any): Complex;
  static core2class(
    complex: typeof Complex,
    simple: typeof Simple,
    key: string,
    json: any,
    parent: Complex,
  ): Complex | Simple;
  static core2class(
    complex: typeof Complex,
    simple: typeof Simple,
    key: string,
    json: any,
    parent?: Complex,
  ): Complex | Simple | undefined {
    const array: boolean[] = [];
    while (Array.isArray(json)) {
      // 先取 1，再用 0 复写，注意反过来会有问题
      array.push(json[1] === null);
      json = json[0];
    }

    const optional = key.endsWith('?');
    key = optional ? key.slice(0, -1) : key;

    const type = Object.prototype.toString.call(json).slice(8, -1).toLowerCase();
    switch (type) {
      case 'string':
      case 'number':
      case 'boolean':
        if (!parent) {
          throw '简单类型必须有父类型';
        }
        // @ts-ignore
        return new simple(key, array, optional, json, parent, type);
      case 'object':
        // @ts-ignore
        const self = new complex(key, array, optional, json, parent);
        self.child = Object.keys(json)
          .map(k => this.core2class(complex, simple, k, json[k], self))
          .filter(e => e);
        return self;
      case 'null':
      // 配置的空数组，没有给数组元素
      case 'undefined':
        break;
      default:
        throw `不可能出现的错误 ${type}`;
    }
  }

  static convertKeyword(str: string, prefix: string, restore: boolean) {
    // todo: keywords 清洗
    if (restore) {
      return str.replace(new RegExp(`${prefix}(\\d+)`, 'g'), (_, e) => String.fromCharCode(e));
    } else {
      if (new RegExp(`${prefix}\d+`).test(str)) {
        throw `${str} contains invalid field names`;
      }
      return str.replace(/[^a-zA-Z\d]/g, e => `${prefix}${e.charCodeAt(0)}`);
    }
  }

  static addX(child: string) {
    return `${String.fromCharCode(60)}${child}${String.fromCharCode(62)}`;
  }

  static toUpperCaseFirst(str: string) {
    if (str.length) {
      return `${str.substring(0, 1).toUpperCase()}${str.substring(1)}`;
    } else {
      return str;
    }
  }

  abstract arrayType(array: boolean[], type: string): string;

  toProp(key: Key) {
    if (key.array.length) {
      if (key.optional) {
        return `${this.arrayType(key.array, key.decl)}? ${key.prop};`;
      } else {
        return `${this.arrayType(key.array, key.decl)} ${key.prop} = [];`;
      }
    } else {
      if (key.optional) {
        return `${key.decl}? ${key.prop};`;
      } else {
        return `${key.decl} ${key.prop} = ${key.def};`;
      }
    }
  }
}
