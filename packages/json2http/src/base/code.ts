import { Json2classBase, Json2classDart } from 'json2class';
import { SchemaPlan, SchemaBody } from './schema';
import { func } from './func';

Json2classBase.Complex.refsValidate(e => {
  const x = Json2classBase.validate(e);
  if (x) {
    const i = x.indexOf('#');
    let launch = x.slice(0, i);
    const ref = x.slice(i + 1);
    if (i < 0) {
      func.assertError('$ref is missing the anchor marker(#)');
    }
    if (!launch) {
      let p = e.parent;
      while (p) {
        launch = p.key;
        p = p.parent;
      }
    }
    return `/${func.convertLaunch(launch)}${ref}`;
  }
  return x;
});

// todo: 增加统一代理机制
const simpleToDecl2Def = Json2classDart.Simple.prototype.toDecl2Def;
Json2classDart.Simple.prototype.toDecl2Def = function () {
  if (func.isBodyFiles(this)) {
    return { decl: func.envJson2http.extend.executor ? 'Extend.MultipartFile' : 'Dio.MultipartFile', def: 'null' };
  }
  return simpleToDecl2Def.call(this, this.type);
};
const complexToClass = Json2classDart.Complex.prototype.toClass;
Json2classDart.Complex.prototype.toClass = function () {
  if (func.isBodyFiles(this)) {
    this.child.forEach(e => {
      e.optional = true;
      e.array = e.array.map(() => true);
    });
  }
  return complexToClass.call(this);
};

export abstract class Http<C extends Json2classBase.Complex, S extends Json2classBase.Simple<Json2classBase.Complex>> {
  static toEntry() {
    return '';
  }

  json2plan(plan: C) {
    return (plan.child as (C | S)[]).reduce((x, cur) => {
      if (cur.optional) {
        return x;
      }

      if (cur instanceof Json2classBase.Complex) {
        switch (cur.key) {
          case 'seg':
            x.seg = cur;
            break;
          case 'res':
            x.res = cur;
            break;
          case 'params':
            x.params = cur;
            break;
          case 'body':
            x.body = cur;
            break;
          default:
            func.unreachableError('json2plan.complex');
        }
      } else {
        switch (cur.key) {
          case 'path':
            x.path = cur;
            break;
          case 'title':
            x.title = cur;
            break;
          case 'method':
            x.method = cur;
            break;
          default:
            func.unreachableError('json2plan.simple');
        }
      }

      return x;
    }, {} as typeof this.plan);
  }

  plan: SchemaPlan<C, S>;

  launch: string;

  get declPlan() {
    return `plan${this.launch}`;
  }

  protected constructor(public key: string, plan: C) {
    this.plan = this.json2plan(plan);
    this.launch = plan.key;
  }

  abstract toLaunch(body?: SchemaBody): { code: string; alias: string };

  toCode() {
    const { plan } = this;
    let body: SchemaBody | undefined;
    if (plan.body) {
      const type = plan.body.getChildByKey('type', false)?.origin as SchemaBody['type'];
      if (!type) {
        func.unreachableError('body.type cannot be empty');
      }
      if (type === 'form') {
        const data = plan.body.getChildByKey('data');
        const fields = data?.getChildByKey('fields');
        const files = data?.getChildByKey('files');
        if (!fields || !files) {
          func.unreachableError('fields and files must exist when body.type is form');
          throw 0;
        }
        body = { type, data: { fields, files } };
      } else {
        body = { type, data: plan.body.getChildByKey('data', null) };
      }
    }
    const { code, alias } = this.toLaunch(body);
    return {
      context: this as typeof this,
      code,
      alias,
      dep: [
        plan.res,
        plan.seg,
        plan.params,
        ...(body?.type === 'form' ? [body.data.fields, body.data.files] : [body?.data]),
      ].reduce((codes, cur) => {
        if (!(cur instanceof Json2classBase.Complex)) {
          return codes;
        }
        codes.push(...cur.toCode());
        return codes;
      }, [] as { context: Json2classBase.Complex; code: string }[]),
    };
  }
}
