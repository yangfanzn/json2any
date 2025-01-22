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
    func.assertError(`configured unsupported field [${ks.join()}]`, plan);
  }

  const path = plan.getChildByKey('path', false);
  const seg = plan.getChildByKey('seg', null);

  const title = plan.getChildByKey('title', false);
  const method = plan.getChildByKey('method', false);
  const res = plan.getChildByKey('res', true);
  const params = plan.getChildByKey('params', null);
  const body = plan.getChildByKey('body', null);

  if (!path || func.type(path.origin) !== JsonType.String) {
    return func.unreachableError('path must exist and is an string', plan);
  }
  if (!path.origin.startsWith('/')) {
    func.assertError('path must start with /', plan);
  }

  if (seg) {
    if (
      !(seg instanceof Json2classBase.Complex) ||
      // func.type(seg.origin) !== JsonType.Object ||
      Object.values(seg.origin).filter(e => func.type(e) !== JsonType.String).length
    ) {
      return func.unreachableError(`seg must be an map${func.addX('string, string')}`, plan);
    }
  }

  if (!title || title.array.length || func.type(title.origin) !== JsonType.String) {
    return func.assertError('title must exist and is an string', plan);
  }

  if (!method || method.array.length || func.type(method.origin) !== JsonType.String) {
    return func.assertError('method must exist and is an string', plan);
  }
  if (!methodTypes.includes(method.origin)) {
    func.assertError(`method = ${method.origin} is out of the enums[${methodTypes}] range`, plan);
  }

  if (!res || res.array.length) {
    return func.assertError('res must exist and is an object', plan);
  }

  // use plan.origin for check params when null or []
  if (plan.origin.hasOwnProperty('params')) {
    if (
      // !(params instanceof Json2classBase.Complex) ||
      // params.array.length ||
      func.type(plan.origin.params) !== JsonType.Object ||
      Object.values(plan.origin.params).filter(e => func.type(e) !== JsonType.String).length
    ) {
      func.assertError(`params must be an map${func.addX('string, string')}`, plan);
    }
  }
  if (params && !(params instanceof Json2classBase.Complex)) {
    return func.unreachableError('unnecessary check just for schemaBody static type check', plan);
  }

  let schemaBody: SchemaBody | undefined;

  if (body) {
    if (!(body instanceof Json2classBase.Complex) || body.array.length || func.type(body.origin) !== JsonType.Object) {
      return func.assertError('body must be an object', plan);
    }

    // when non-type, default is json
    const type = body.origin.hasOwnProperty('type') ? body.origin.type : 'json';
    if (!bodyTypes.includes(type)) {
      func.assertError(`body.type = ${type} is out of the enums[${bodyTypes}] range`, plan);
    }

    switch (type) {
      case 'map':
        if (
          func.type(body.origin.data) !== JsonType.Object ||
          Object.values(body.origin.data).filter(e => func.type(e) !== JsonType.String).length
        ) {
          func.assertError(`body.map.data must be an map${func.addX('string, string')}`, plan);
        }
        break;
      case 'form':
        const data = body.getChildByKey('data');
        const fields = data?.getChildByKey('fields');
        const files = data?.getChildByKey('files');
        const error = `fields and files in body.form.data must be an map${func.addX('string, string | string[]')}`;

        if (
          !data ||
          !fields ||
          !files ||
          func.type(data.origin) !== JsonType.Object ||
          func.type(fields.origin) !== JsonType.Object ||
          func.type(files.origin) !== JsonType.Object
        ) {
          return func.assertError(error, plan);
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
          func.assertError(error, plan);
        } else if (conflict) {
          func.assertError(`fields and files in body.form.data has conflict field name of ${conflict}`, plan);
        }

        schemaBody = { type, data: { fields, files } };

        break;
      case 'plain':
      case 'byte':
        if (body.origin.hasOwnProperty('data')) {
          func.assertError(`body.${type}.data is forbidden to set`, plan);
        }
        break;
      case 'json':
        if (body.origin.data === null || body.origin.data === undefined) {
          func.assertError('body.json.data must exist and cannot be null', plan);
        }
        break;
      default:
        func.unreachableError(`${type} is a non-existent body.type`, plan);
        break;
    }

    schemaBody ??= { type, data: body.getChildByKey('data', null) };
  }

  return { path, seg, title, method, res, params, body: schemaBody };
};
