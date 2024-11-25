import { _C, _S } from './code';

export class _F {
  core(complex: typeof _C, simple: typeof _S, key: string, json: any): _C;
  core(complex: typeof _C, simple: typeof _S, key: string, json: any, parent: _C): _C | _S;
  core(complex: typeof _C, simple: typeof _S, key: string, json: any, parent?: _C): _C | _S | undefined {
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
          .map(k => this.core(complex, simple, k, json[k], self))
          .filter(e => e);
        return self;
      case 'null':
        break;
      default:
        throw '不可能出现的错误';
    }
  }

  convertKeyword(str: string, prefix: string, restore: boolean) {
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
}

export const fun = new _F();
