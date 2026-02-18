import { func } from './func';
import { JsonType } from './type';
import { Complex, Key, Simple } from './code';

type SchemaGroup = (SchemaItem | null)[][];
export type SchemaItem = {
  key: string;
  required: boolean;
  optional: boolean;
  array: boolean | null;
} & (
  | {
      origin: null;
      child: SchemaGroup;
    }
  | {
      origin:
        | 'Record.Simple'
        | 'Record.String'
        | 'Record.Array.String'
        | 'Record.Array.Simple'
        | 'Complex'
        | 'String'
        | ((origin: any) => string);
      child: null;
    }
);

export const validateItem = (
  items: Key[],
  schemaItem: SchemaItem,
  item?: Complex | Simple<Complex>,
): Key | Record<string, any> | undefined => {
  const keys = [...items, item]
    .filter(e => e)
    .map(e => e?.key)
    .join('.');
  const root = items[0] instanceof Complex ? items[0] : undefined;

  if (schemaItem.required && !item) {
    return func.assertError(`${keys}.${schemaItem.key} must be required`, root);
  }
  if (!item) {
    // is not required, no check if not provided.
    return;
  }
  if (!schemaItem.optional && item.optional) {
    return func.assertError(`${keys} can not be optional`, root);
  }
  if (schemaItem.array !== null && !schemaItem.array && item.array.length) {
    return func.assertError(`${keys} can not be an array`, root);
  }
  switch (schemaItem.origin) {
    case 'Complex':
      if (item instanceof Simple) {
        return func.assertError(`${keys} must be an object`, root);
      }
      break;
    case 'Record.Simple':
      if (
        func.type(item.origin) !== JsonType.Object ||
        Object.values(item.origin).findIndex(
          e => ![JsonType.String, JsonType.Number, JsonType.Boolean].includes(func.type(e) as JsonType),
        ) >= 0
      ) {
        return func.assertError(`${keys} must be a map${func.addX('string, string | number | boolean')}`, root);
      }
      break;
    case 'Record.String':
      if (
        func.type(item.origin) !== JsonType.Object ||
        Object.values(item.origin).findIndex(e => func.type(e) !== JsonType.String) >= 0
      ) {
        return func.assertError(`${keys} must be a map${func.addX('string, string')}`, root);
      }
      break;
    case 'Record.Array.String':
    case 'Record.Array.Simple':
      let typeMessage = 'string, string | string[]';
      const condition = [JsonType.String, JsonType.Null];
      if (schemaItem.origin === 'Record.Array.Simple') {
        condition.push(JsonType.Number, JsonType.Boolean);
        typeMessage = 'string, (string | number | boolean) | (string | number | boolean)[]';
      }
      const check = (data: any) => {
        const c = (e: any) => !condition.includes(func.type(e) as JsonType);
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
      if (func.type(item.origin) !== JsonType.Object || check(item.origin)) {
        return func.assertError(`${keys} must be a map${func.addX(typeMessage)}`, root);
      }
      break;
    case 'String':
      if (func.type(item.origin) !== JsonType.String) {
        return func.assertError(`${keys} must be a string`, root);
      }
      break;
    case null:
      // no check, go next
      break;
    default:
      const err = schemaItem.origin(item.origin);
      if (err) {
        return func.assertError(`${keys} ${err}`, root);
      }
  }

  if (!schemaItem.child?.length) {
    // no check if array is null, but return Key object
    return item;
  }

  const obj: Record<string, any> = {};
  if (!schemaItem.child.length) {
    // no check if array is empty, but return keyof object
    return obj;
  }

  if (item instanceof Simple) {
    // item must be a Complex if child has element
    func.assertError(`${schemaItem.key} must be an object`, root);
    return obj;
  }

  const vs2obj = (vs: SchemaGroup[number], e: Complex, o: Record<string, any>) => {
    const ks: string[] = [];
    // o is set key-value by ref
    vs.forEach(v => {
      if (v === null) {
        // no check if null
        return;
      }
      ks.push(v.key);
      o[v.key] = validateItem([...items, e], v, e.getChildByKey(v.key, true, null));
    });
    // more keys check
    const err = e.child.find(e => !ks.includes(e.key));
    if (err) {
      func.assertError(`${keys} does not have the field ${err.key} in its configuration`, root);
    }
  };

  if (schemaItem.child.length === 1) {
    // condition group
    const vs = schemaItem.child[0];
    if (!vs) {
      // just for static type check
      return obj;
    }
    // set value by ref
    vs2obj(vs, item, obj);
  } else {
    // non condition group, must be passed in first element
    // check follow config by element index
    const errs: string[] = [];
    const condition =
      schemaItem.child[0]?.findIndex(v => {
        try {
          if (!v) {
            // do not check if null
            return true;
          }
          // just check for get index, then do full check to get result
          validateItem([...items, item], v, item.getChildByKey(v.key, true, null));
          return true;
        } catch (e) {
          errs.push(`${e}`);
          return false;
        }
      }) ?? -1;

    if (condition < 0) {
      func.unreachableError(errs.join('\n'), root);
      return obj;
    }

    // set first element that just check passed to group
    const vs: SchemaGroup[number] = [schemaItem.child[0]?.[condition] ?? null];
    for (let i = 1; i < schemaItem.child.length; i++) {
      const v = schemaItem.child[i]?.[condition];
      if (v === undefined) {
        func.unreachableError('the condition bit that passed does not have a related config', root);
        return obj;
      }
      vs.push(v);
    }
    vs2obj(vs, item, obj);
  }

  return obj;
};

const schemaMeta: SchemaItem = {
  key: '$meta',
  required: true,
  optional: false,
  array: false,
  origin: null,
  child: [
    [
      {
        key: 'ref',
        required: true,
        optional: false,
        array: false,
        origin: o => {
          if (func.type(o) !== JsonType.String) {
            return 'must be a string';
          }
          if (!o.includes('#')) {
            return 'is missing the anchor marker(#)';
          }
          return '';
        },
        child: null,
      },
    ],
    [null],
  ],
};

export const validate = (e: Complex) => {
  const $meta = e.getChildByKey('$meta', false, null);

  if (!$meta) {
    return '';
  }

  const t = validateItem([], schemaMeta, $meta) as Record<string, any>;

  // although it is not secure, it should be fine
  if (t['ref']) {
    let index = t['ref'].origin as string;
    const i = index.indexOf('#');
    let filename = index.slice(0, i);
    index = index.slice(i + 1);
    if (!filename) {
      filename = e.getRoot().key;
    }
    return `${filename}#${index}`;
  } else {
    // other extra config
  }

  func.unreachableError('$meta.ref is the only configuration currently supported', e);
  return '';
};
