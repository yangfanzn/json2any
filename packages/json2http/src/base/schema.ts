import { Json2classBase } from 'json2class';

const methodTypes = ['GET', 'POST', 'PUT', 'DELETE'] as const;
export const contentTypes = {
  json: 'application/json',
  map: 'application/x-www-form-urlencoded',
  form: 'multipart/form-data',
  byte: 'application/octet-stream',
  plain: 'text/plain',
} as const;
export const bodyTypes = Object.keys(contentTypes);

export interface SchemaPlan {
  path: Json2classBase.Simple<Json2classBase.Complex>;
  seg?: Json2classBase.Complex;
  title: Json2classBase.Simple<Json2classBase.Complex>;
  method: Json2classBase.Simple<Json2classBase.Complex>;
  res: Json2classBase.Complex;
  params?: Json2classBase.Complex;
  body?: SchemaBody;
}
interface SchemaBodyBase {
  type: keyof typeof contentTypes;
}
interface SchemaBodyForm extends SchemaBodyBase {
  type: 'form';
  data: {
    fields: Json2classBase.Complex;
    files: Json2classBase.Complex;
  };
}
interface SchemaBodyOther extends SchemaBodyBase {
  type: Exclude<keyof typeof contentTypes, 'form'>;
  data?: Json2classBase.Complex | Json2classBase.Simple<Json2classBase.Complex>;
}
type SchemaBody = SchemaBodyForm | SchemaBodyOther;

export const validate = (plan: Json2classBase.Complex): SchemaPlan => {
  const { JsonType, func } = Json2classBase;

  plan = plan.getReal();

  const ks = plan.child
    .map(e => {
      const key = e.key;
      return ['title', 'method', 'params', 'body', 'res', 'path', 'seg'].includes(key) ? '' : key;
    })
    .filter(Boolean);
  if (ks.length) {
    func.assertError(`configured unsupported field [${ks.join()}]`);
  }

  const path = plan.getChildByKey('path', false);
  const seg = plan.getChildByKey('seg', null);

  const title = plan.getChildByKey('title', false);
  const method = plan.getChildByKey('method', false);
  const res = plan.getChildByKey('res', true);
  const params = plan.getChildByKey('params', null);
  const body = plan.getChildByKey('body', null);

  if (!path || func.type(path.origin) !== JsonType.String) {
    func.unreachableError('path must exist and is an string');
    throw 0;
  }
  if (!path.origin.startsWith('/')) {
    func.assertError('path must start with /');
  }

  if (seg) {
    if (
      !(seg instanceof Json2classBase.Complex) ||
      // func.type(seg.origin) !== JsonType.Object ||
      Object.values(seg.origin).filter(e => func.type(e) !== JsonType.String).length
    ) {
      func.unreachableError(`seg must be an record${func.addX('string, string')}`);
      throw 0;
    }
  }

  if (!title || title.array.length || func.type(title.origin) !== JsonType.String) {
    func.assertError('title must exist and is an string');
    throw 0;
  }

  if (!method || method.array.length || func.type(method.origin) !== JsonType.String) {
    func.assertError('method must exist and is an string');
    throw 0;
  }
  if (!methodTypes.includes(method.origin)) {
    func.assertError(`method = ${method.origin} is out of the enums[${methodTypes}] range`);
  }

  if (!res || res.array.length) {
    func.assertError('res must exist and is an object');
    throw 0;
  }

  // use plan.origin for check params when null or []
  if (plan.origin.hasOwnProperty('params')) {
    if (
      // !(params instanceof Json2classBase.Complex) ||
      // params.array.length ||
      func.type(plan.origin.params) !== JsonType.Object ||
      Object.values(plan.origin.params).filter(e => func.type(e) !== JsonType.String).length
    ) {
      func.assertError(`params must be an record${func.addX('string, string')}`);
      throw 0;
    }
  }
  if (params && !(params instanceof Json2classBase.Complex)) {
    func.unreachableError('unnecessary check just for schemaBody static type check');
    throw 0;
  }

  let schemaBody: SchemaBody | undefined;

  if (body) {
    if (!(body instanceof Json2classBase.Complex) || body.array.length || func.type(body.origin) !== JsonType.Object) {
      func.assertError('body must be an object');
      throw 0;
    }

    // when non-type, default is json
    const type = body.origin.hasOwnProperty('type') ? body.origin.type : 'json';
    if (!bodyTypes.includes(type)) {
      func.assertError(`body.type = ${type} is out of the enums[${bodyTypes}] range`);
    }

    switch (type) {
      case 'map':
        if (
          func.type(body.origin.data) !== JsonType.Object ||
          Object.values(body.origin.data).filter(e => func.type(e) !== JsonType.String).length
        ) {
          func.assertError(`body.map.data must be an record${func.addX('string, string')}`);
        }
        break;
      case 'form':
        const data = body.getChildByKey('data');
        const fields = data?.getChildByKey('fields');
        const files = data?.getChildByKey('files');
        const error = `fields and files in body.form.data must be an record${func.addX('string, string | string[]')}`;

        if (
          !data ||
          !fields ||
          !files ||
          func.type(data.origin) !== JsonType.Object ||
          func.type(fields.origin) !== JsonType.Object ||
          func.type(files.origin) !== JsonType.Object
        ) {
          func.assertError(error);
          throw 0;
        }
        const keys = Object.assign({}, fields.origin, files.origin);
        let conflict = '';
        if (
          Object.keys(keys).filter(k => {
            conflict = fields.origin.hasOwnProperty(k) && files.origin.hasOwnProperty(k) ? k : '';
            const e = keys[k];
            if (func.type(e) === JsonType.Array) {
              return (e as []).find(ee => func.type(ee) !== JsonType.String);
            }
            return func.type(e) !== JsonType.String;
          }).length
        ) {
          func.assertError(error);
        } else if (conflict) {
          func.assertError(`fields and files in body.form.data has conflict field name of ${conflict}`);
        }

        schemaBody = { type, data: { fields, files } };

        break;
      case 'plain':
      case 'byte':
        if (body.origin.hasOwnProperty('data')) {
          func.assertError(`body.${type}.data is forbidden to set`);
        }
        break;
      case 'json':
        if (body.origin.data === null || body.origin.data === undefined) {
          func.assertError('body.json.data must exist and cannot be null');
        }
        break;
      default:
        func.unreachableError(`${type} is a non-existent body.type`);
        break;
    }

    schemaBody ??= { type, data: body.getChildByKey('data', null) };
  }

  return { path, seg, title, method, res, params, body: schemaBody };
};
