import { Json2classBase, Json2classDart } from 'json2class';
import { SchemaPlan, validate } from './schema';
import { func } from './func';
import { env } from './type';

Object.defineProperty(Json2classBase.Key.prototype, 'prop', {
  get() {
    let key = this.key;
    if (!this.parent) {
      // no parent, is complex, and is top.
      // remove the '/{}' and concatenate directly.
      // consistent with the way nested objects are concatenated.
      // '/{}' in json key are properly escaped.
      key = key.replace(/[\/{}]/g, '');
    }
    return func.convertKeyword(key, this.lang.keywords, false);
  },
});

// todo: 增加统一代理机制
const simpleToDecl2Def = Json2classDart.Simple.prototype.toDecl2Def;
Json2classDart.Simple.prototype.toDecl2Def = function () {
  if (func.isBodyFiles(this)) {
    return { decl: env.extend.agent ? 'Extend.MultipartFile' : 'Dio.MultipartFile', def: 'null' };
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

  launch: string;

  get declPlan() {
    return `plan${this.launch}`;
  }

  protected constructor(public key: string, public plan: C) {
    this.launch = func.convertLaunch(key);
  }

  abstract toLaunch(plan: SchemaPlan): { code: string; plan: string };

  toCode() {
    Json2classBase.Complex.refsResolve();

    const plan = validate(this.plan);
    const { code, plan: code2 } = this.toLaunch(plan);
    return {
      context: this as typeof this,
      code,
      plan: code2,
      dep: [
        plan.res,
        plan.seg,
        plan.params,
        ...(plan.body?.type === 'form' ? [plan.body.data.fields, plan.body.data.files] : [plan.body?.data]),
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
