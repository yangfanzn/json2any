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
  res?: Json2classBase.Complex;
  params?: Json2classBase.Complex;
  body?: SchemaBody;
  headers?: Json2classBase.Complex;
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

  let ks = plan.child
    .map(e => (['path', 'seg', 'title', 'method', 'res', 'params', 'body', 'headers'].includes(e.key) ? '' : e.key))
    .filter(Boolean);
  if (ks.length) {
    func.assertError(`configured unsupported plan field [${ks.join()}]`, plan);
  }

  const path = plan.getChildByKey('path', true, false);
  const seg = plan.getChildByKey('seg', true, null);
  const title = plan.getChildByKey('title', true, false);
  const method = plan.getChildByKey('method', true, false);
  const res = plan.getChildByKey('res', true, null);
  const params = plan.getChildByKey('params', true, null);
  const body = plan.getChildByKey('body', true, null);
  const headers = plan.getChildByKey('headers', true, null);

  const optionals: (Json2classBase.Key | undefined)[] = [];

  if (!path || func.type(path.origin) !== JsonType.String) {
    return func.unreachableError('path must exist and is an string', plan);
  }
  if (!(path.origin as string).startsWith('/')) {
    func.assertError('path must start with /', plan);
  }

  if (seg) {
    if (
      !(seg instanceof Json2classBase.Complex) ||
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
  if (!methodTypes.includes(method.origin as 'GET')) {
    func.assertError(`method = ${method.origin} is out of the enums[${methodTypes}] range`, plan);
  }

  // use [plan].origin for check res when null or []
  if (plan.origin.hasOwnProperty('res')) {
    if (func.type(plan.origin['res']) !== JsonType.Object) {
      func.assertError('res must be an object', plan);
    }
  }
  if (res && !(res instanceof Json2classBase.Complex)) {
    return func.unreachableError('unnecessary check just for schemaBody.res static type check', plan);
  }

  // use [plan].origin for check params when null or []
  if (plan.origin.hasOwnProperty('params')) {
    if (
      func.type(plan.origin['params']) !== JsonType.Object ||
      Object.values(plan.origin['params']).filter(e => func.type(e) !== JsonType.String).length
    ) {
      func.assertError(`params must be an map${func.addX('string, string')}`, plan);
    }
  }
  if (params && !(params instanceof Json2classBase.Complex)) {
    return func.unreachableError('unnecessary check just for schemaBody.params static type check', plan);
  }

  let schemaBody: SchemaBody | undefined;

  // use [plan].origin for check body when null or []
  if (plan.origin.hasOwnProperty('body')) {
    if (func.type(plan.origin['body']) !== JsonType.Object) {
      return func.assertError('body must be an object', plan);
    }
    if (!body || !(body instanceof Json2classBase.Complex)) {
      return func.unreachableError('unnecessary check just for schemaBody.body static type check', plan);
    }

    ks = body.child.map(e => (['type', 'data'].includes(e.key) ? '' : e.key)).filter(Boolean);
    if (ks.length) {
      func.assertError(`configured unsupported body field [${ks.join()}]`, plan);
    }

    // when non-type, default is json
    const type = body.origin.hasOwnProperty('type') ? body.origin['type'] : 'json';
    if (!bodyTypes.includes(type)) {
      func.assertError(`body.type = ${type} is out of the enums[${bodyTypes}] range`, plan);
    }
    optionals.push(body.getChildByKey('type', true, null));

    switch (type) {
      case 'map':
        if (
          func.type(body.origin['data']) !== JsonType.Object ||
          Object.values(body.origin['data']).filter(e => func.type(e) !== JsonType.String).length
        ) {
          func.assertError(`body.map.data must be an map${func.addX('string, string')}`, plan);
        }
        break;
      case 'form':
        // both of all are true [complex]: must exist
        const data = body.getChildByKey('data', true, true);
        const fields = data?.getChildByKey('fields', true, true);
        const files = data?.getChildByKey('files', true, true);
        const error = `fields and files in body.form.data must be an map${func.addX('string, string | string[]')}`;

        const check = (data: any) => {
          // data has been checked is object
          const c = (e: any) => ![JsonType.String, JsonType.Null].includes(func.type(e) as Json2classBase.JsonType);
          return (
            Object.keys(data).findIndex(k => {
              const e = data[k];
              if (func.type(e) === JsonType.Array) {
                return (e as []).findIndex(ee => c(ee)) >= 0;
              }
              return c(e);
            }) >= 0
          );
        };

        if (
          !data ||
          !fields ||
          !files ||
          func.type(data.origin) !== JsonType.Object ||
          func.type(fields.origin) !== JsonType.Object ||
          func.type(files.origin) !== JsonType.Object ||
          check(fields.origin) ||
          check(files.origin)
        ) {
          return func.assertError(error, plan);
        }

        ks = data.child.map(e => (['fields', 'files'].includes(e.key) ? '' : e.key)).filter(Boolean);
        if (ks.length) {
          func.assertError(`configured unsupported body.form.data field [${ks.join()}]`, plan);
        }

        optionals.push(data, fields, files);
        schemaBody = { type, data: { fields, files } };

        break;
      case 'plain':
      case 'byte':
        if (body.origin.hasOwnProperty('data')) {
          func.assertError(`body.${type}.data is forbidden to set`, plan);
        }
        break;
      case 'json':
        if (!body.getChildByKey('data', true, null)) {
          func.assertError('body.json.data must exist and cannot be null', plan);
        }
        break;
      default:
        func.unreachableError(`${type} is a non-existent body.type`, plan);
        break;
    }

    schemaBody ??= { type, data: body.getChildByKey('data', true, null) };
  }

  // use [plan].origin for check headers when null or []
  if (plan.origin.hasOwnProperty('headers')) {
    if (
      func.type(plan.origin['headers']) !== JsonType.Object ||
      Object.values(plan.origin['headers']).filter(e => {
        if (func.type(e) === JsonType.Array) {
          return (e as []).find(ee => func.type(ee) !== JsonType.String);
        }
        return func.type(e) !== JsonType.String;
      }).length
    ) {
      func.assertError(`headers must be an map${func.addX('string, string | string[]')}`, plan);
    }
  }
  if (headers && !(headers instanceof Json2classBase.Complex)) {
    return func.unreachableError('unnecessary check just for schemaBody.headers static type check', plan);
  }

  optionals.push(...[path, seg, title, method, res, params, headers, body]);
  ks = optionals.filter(e => e?.optional).map(e => e?.key ?? '');
  if (ks.length) {
    func.assertError(`cannot set as optional [${ks.join()}]`, plan);
  }

  return { path, seg, title, method, res, params, body: schemaBody, headers };
};
