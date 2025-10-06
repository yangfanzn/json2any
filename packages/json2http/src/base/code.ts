import { Json2classBase, Json2classDart, Json2classArkTs, Json2classKotlin, Json2classSwift } from 'json2class';
import { SchemaPlan, validate } from './schema';
import { func } from './func';

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

[{ type: Json2classDart }, { type: Json2classArkTs }, { type: Json2classKotlin }, { type: Json2classSwift }].forEach(
  e => {
    const simple = e.type.Simple.prototype;
    const complex = e.type.Complex.prototype;

    // why here must be use simple?
    // 1. boyd.files.key is string or string[], so is must be simple
    // 2. func.isBodyFiles check this is body.files.key by parents type, if it uses complex, body.files check wrong
    const simpleToDecl2Def = simple.toDecl2Def;
    simple.toDecl2Def = function () {
      if (func.isBodyFiles(this)) {
        return { decl: 'BodyFormFile', def: 'null' };
      }
      return simpleToDecl2Def.call(this);
    };

    const complexToClass = complex.toClass;
    complex.toClass = function () {
      if (func.isBodyFiles(this)) {
        this.child.forEach(e => {
          if (!e.array.length) {
            e.optional = true;
          }
        });
      }
      return complexToClass.call(this);
    };
  },
);

export abstract class Http<C extends Json2classBase.Complex, S extends Json2classBase.Simple<Json2classBase.Complex>> {
  static toEntry() {
    return '';
  }

  launch: string;

  get declPlan() {
    return `${this.launch}plan`;
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
