import { Json2classBase } from 'json2class';
import { Http } from './code';

export class Func extends Json2classBase.Func {
  core2http(
    http: typeof Http<Json2classBase.Complex, Json2classBase.Simple<Json2classBase.Complex>>,
    complex: typeof Json2classBase.Complex,
    simple: typeof Json2classBase.Simple<Json2classBase.Complex>,
    key: string,
    json: Record<string, any>,
    file?: string,
  ): Http<Json2classBase.Complex, Json2classBase.Simple<Json2classBase.Complex>> {
    // must be objected
    if (this.type(json) !== Json2classBase.JsonType.Object) {
      this.assertError('plan config must be an object', [file, key]);
    }

    // if not have path, set key to path
    // because of get seg from path, here must transform to string
    const path = `${json['path'] ?? key}`;

    // get seg from path
    const seg = path.match(/{.*?}/g)?.reduce((x, cur) => {
      x[cur.slice(1, -1)] = '';
      return x;
    }, {} as Record<string, string>);

    if (!json.hasOwnProperty('$meta')) {
      // let plan config can be reused,
      // although it seems like it does not have any practical use
      json = { ...json, path, seg };
    }

    // @ts-ignore
    return new http(
      key,
      this.core2class(
        complex as typeof Json2classBase.Complex,
        simple as typeof Json2classBase.Simple,
        key,
        json,
        undefined,
        file,
      ),
    );
  }

  convertLaunch(str: string) {
    return str.replace(/[\/{}]/g, '');
  }

  isBodyFiles(self: Json2classBase.Key) {
    if (self instanceof Json2classBase.Simple) {
      return (
        self.parent?.parent?.parent?.parent &&
        self.parent.key === 'files' &&
        self.parent.parent.key === 'data' &&
        self.parent.parent.parent.key === 'body' &&
        !self.parent.parent?.parent?.parent?.parent
      );
    } else {
      return (
        self.parent?.parent?.parent &&
        self.key === 'files' &&
        self.parent.key === 'data' &&
        self.parent.parent.key === 'body' &&
        !self.parent?.parent?.parent?.parent
      );
    }
  }
}

export const func = new Func();
