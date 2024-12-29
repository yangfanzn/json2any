// @ts-nocheck
import Ajv from 'ajv';
import { SchemaTs, schemaJson } from './schema';
import { bin } from './bin';

export function test() {
  const ajv = new Ajv();
  const validate = ajv.compile(schemaJson);

  (() => {
    const x: SchemaTs[] = [{ path: '' }, { path: '', title: '' }, { path: '', title: '', method: 'POST' }];
    const n = x.findIndex(e => validate(e));
    if (n >= 0) {
      bin.exit(`[{n}]: title method res 必须`);
      return;
    }
  })();

  (() => {
    const x: SchemaTs[] = [{ path: '', title: '', method: 'XXX', res: {} }];
    const n = x.findIndex(e => validate(e));
    if (n >= 0) {
      bin.exit(`[${n}]: method 不是枚举范围`);
      return;
    }
  })();

  (() => {
    const x: SchemaTs[] = [
      { path: '', title: '', method: 'POST', res: null },
      { path: '', title: '', method: 'POST', res: 1 },
      { path: '', title: '', method: 'POST', res: 'a' },
      { path: '', title: '', method: 'POST', res: false },
      { path: '', title: '', method: 'POST', res: [] },
      { path: '', title: '', method: 'POST', res: [{}] },
    ];
    const n = x.findIndex(e => validate(e));
    if (n >= 0) {
      bin.exit(`[${n}]: res 必须是对象`);
      return;
    }
  })();

  (() => {
    const x: SchemaTs[] = [
      { path: '', title: 'title', method: 'POST', res: {}, params: null },
      { path: '', title: 'title', method: 'POST', res: {}, params: 1 },
      { path: '', title: 'title', method: 'POST', res: {}, params: false },
      { path: '', title: 'title', method: 'POST', res: {}, params: [] },
      { path: '', title: 'title', method: 'POST', res: {}, params: { a: 1 } },
      { path: '', title: 'title', method: 'POST', res: {}, params: { a: { a: 'a' } } },
      // 虽然静态检查不报错，但是通不过 Schema 检查，这不是问题。
      // { path: '', title: 'title', method: 'POST', res: {}, params: { 1: 'a' } },
    ];
    const n = x.findIndex(e => validate(e));
    if (n >= 0) {
      bin.exit(`[${n}]: params 必须是 Record<string, string>`);
      return;
    }
  })();

  (() => {
    const x: SchemaTs[] = [
      { path: '', title: 'title', method: 'POST', res: {}, body: null },
      { path: '', title: 'title', method: 'POST', res: {}, body: 1 },
      { path: '', title: 'title', method: 'POST', res: {}, body: {} },
      { path: '', title: 'title', method: 'POST', res: {}, body: { type: '1' } },
    ];
    const n = x.findIndex(e => validate(e));
    if (n >= 0) {
      bin.exit(`[${n}]: body 必须是对象, 必须含有 type 或 data, type 必须是枚举值`);
      return;
    }
  })();

  (() => {
    const x: SchemaTs[] = [
      { path: '', title: '', method: 'POST', res: {}, body: { type: 'json', byte: {} } },
      { path: '', title: '', method: 'POST', res: {}, body: { type: 'map', byte: {} } },
      { path: '', title: '', method: 'POST', res: {}, body: { type: 'plain', byte: {} } },
      { path: '', title: '', method: 'POST', res: {}, body: { type: 'byte', data: 1 } },
    ];
    const n = x.findIndex(e => validate(e));
    if (n >= 0) {
      bin.exit(`[${n}]: byte 只能用在 body.form 中`);
      return;
    }
  })();

  (() => {
    const x: SchemaTs[] = [
      { path: '', title: 'title', method: 'POST', res: {}, body: { type: 'json' } },
      { path: '', title: 'title', method: 'POST', res: {}, body: { data: null } },
      { path: '', title: 'title', method: 'POST', res: {}, body: { type: 'json', data: null } },
    ];
    const n = x.findIndex(e => validate(e));
    if (n >= 0) {
      bin.exit(`[${n}]: body.json 必须是对象, 必须含有 type 或 data，data 是合法的 json，但本身不能是 null`);
      return;
    }
  })();

  (() => {
    const x: SchemaTs[] = [
      { path: '', title: 'title', method: 'POST', res: {}, body: { type: 'map' } },
      { path: '', title: 'title', method: 'POST', res: {}, body: { type: 'map', data: null } },
      { path: '', title: 'title', method: 'POST', res: {}, body: { type: 'map', data: 1 } },
      { path: '', title: 'title', method: 'POST', res: {}, body: { type: 'map', data: [] } },
      { path: '', title: 'title', method: 'POST', res: {}, body: { type: 'map', data: { a: 1 } } },
      { path: '', title: 'title', method: 'POST', res: {}, body: { type: 'map', data: { a: {} } } },
    ];
    const n = x.findIndex(e => validate(e));
    if (n >= 0) {
      bin.exit(`[${n}]: body.map, 必须含有 type 和 data, data 必须是 Record<string, string>`);
      return;
    }
  })();

  (() => {
    const x: SchemaTs[] = [
      { path: '', title: 'title', method: 'POST', res: {}, body: { type: 'form', data: null } },
      { path: '', title: 'title', method: 'POST', res: {}, body: { type: 'form', data: {} } },
      { path: '', title: 'title', method: 'POST', res: {}, body: { type: 'form', data: { fields: 1, files: 1 } } },
      { path: '', title: 'title', method: 'POST', res: {}, body: { type: 'form', data: { fields: {} } } },
      { path: '', title: 'title', method: 'POST', res: {}, body: { type: 'form', data: { files: {} } } },
      {
        path: '',
        title: 'title',
        method: 'POST',
        res: {},
        body: { type: 'form', data: { fields: { a: 1 }, files: {} } },
      },
      {
        path: '',
        title: 'title',
        method: 'POST',
        res: {},
        body: { type: 'form', data: { fields: { a: 'a' }, files: { a: 1 } } },
      },
      {
        path: '',
        title: 'title',
        method: 'POST',
        res: {},
        body: { type: 'form', data: { fields: { a: 'a' }, files: { a: [1] } } },
      },
    ];
    const n = x.findIndex(e => validate(e));
    if (n >= 0) {
      bin.exit(
        `[${n}]: body.form.data, 必须是 { fields: Record<string, string | string[]>， files: Record<string, string | string[]> } 类型`,
      );
      return;
    }
  })();

  (() => {
    const x: SchemaTs[] = [
      { path: '', title: 'title', method: 'POST', res: {}, body: { type: 'plain' } },
      { path: '', title: 'title', method: 'POST', res: {}, body: { type: 'plain', data: null } },
      { path: '', title: 'title', method: 'POST', res: {}, body: { type: 'plain', data: 1 } },
      { path: '', title: 'title', method: 'POST', res: {}, body: { type: 'plain', data: {} } },
    ];
    const n = x.findIndex(e => validate(e));
    if (n >= 0) {
      bin.exit(`[${n}]: body.plain, 必须含有 type 和 data, data 必须是 string`);
      return;
    }
  })();

  (() => {
    const x: SchemaTs[] = [
      { path: '', title: 'title', method: 'POST', res: {}, body: { type: 'byte', data: null } },
      { path: '', title: 'title', method: 'POST', res: {}, body: { type: 'byte', data: 1 } },
    ];
    const n = x.findIndex(e => validate(e));
    if (n >= 0) {
      bin.exit(`[${n}]: body.byte, 只能含有 type，不能有 data`);
      return;
    }
  })();

  /**
   * 上面是不合法的
   * 下面是合法的
   */

  (() => {
    const x: SchemaTs[] = [{ path: '', title: 'title', method: 'POST', res: {} }];
    const n = x.findIndex(e => !validate(e));
    if (n >= 0) {
      bin.exit(`[${n}]: 最基础配置`);
      return;
    }
  })();

  (() => {
    const x: SchemaTs[] = [
      { path: '', title: 'title', method: 'POST', res: {}, params: {} },
      { path: '', title: 'title', method: 'POST', res: {}, params: { x: '' } },
    ];
    const n = x.findIndex(e => !validate(e));
    if (n >= 0) {
      bin.exit(`[${n}]: params`);
      return;
    }
  })();

  (() => {
    const x: SchemaTs[] = [
      { path: '', title: 'title', method: 'POST', res: {}, body: { data: '' } },
      { path: '', title: 'title', method: 'POST', res: {}, body: { type: 'json', data: '' } },
      { path: '', title: 'title', method: 'POST', res: {}, body: { data: 1 } },
      { path: '', title: 'title', method: 'POST', res: {}, body: { data: {} } },
      { path: '', title: 'title', method: 'POST', res: {}, body: { data: [] } },
      { path: '', title: 'title', method: 'POST', res: {}, body: { data: [1] } },
      { path: '', title: 'title', method: 'POST', res: {}, body: { data: [null] } },
      { path: '', title: 'title', method: 'POST', res: {}, body: { data: { x: 1 } } },
      { path: '', title: 'title', method: 'POST', res: {}, body: { type: 'json', data: { x: 1 } } },
      { path: '', title: 'title', method: 'POST', res: {}, body: { data: { x: 1, y: null } } },
      { path: '', title: 'title', method: 'POST', res: {}, body: { data: { x: 'a', y: { a: 1, b: null } } } },
    ];
    const n = x.findIndex(e => !validate(e));
    if (n >= 0) {
      bin.exit(`[${n}]: body.json`);
      return;
    }
  })();

  (() => {
    const x: SchemaTs[] = [
      { path: '', title: 'title', method: 'POST', res: {}, body: { type: 'map', data: {} } },
      { path: '', title: 'title', method: 'POST', res: {}, body: { type: 'map', data: { a: 'a' } } },
      // JSON standard allows only double quoted string as property key 在 json 文件中就语法报错了，问题不大
      // 这个 {1:a} 也是 Record<string, string> 不是错误
      { path: '', title: 'title', method: 'POST', res: {}, body: { type: 'map', data: { 1: 'a' } } },
    ];
    const n = x.findIndex(e => !validate(e));
    if (n >= 0) {
      bin.exit(`[${n}]: body.map`);
      return;
    }
  })();

  (() => {
    const x: SchemaTs[] = [
      { path: '', title: 'title', method: 'POST', res: {}, body: { type: 'form', data: { fields: {}, files: {} } } },
      {
        path: '',
        title: 'title',
        method: 'POST',
        res: {},
        body: { type: 'form', data: { fields: { a: 'a' }, files: {} } },
      },
      {
        path: '',
        title: 'title',
        method: 'POST',
        res: {},
        body: { type: 'form', data: { fields: { a: 'a', b: ['b'], c: [] }, files: {} } },
      },
      {
        path: '',
        title: 'title',
        method: 'POST',
        res: {},
        body: { type: 'form', data: { fields: { a: 'a' }, files: { a: '' } } },
      },
      {
        path: '',
        title: 'title',
        method: 'POST',
        res: {},
        body: { type: 'form', data: { fields: { a: 'a' }, files: { a: '', b: [], c: [''] } } },
      },
    ];
    const n = x.findIndex(e => !validate(e));
    if (n >= 0) {
      bin.exit(`[${n}]: body.form`);
      return;
    }
  })();

  (() => {
    const x: SchemaTs[] = [{ path: '', title: 'title', method: 'POST', res: {}, body: { type: 'plain', data: '' } }];
    const n = x.findIndex(e => !validate(e));
    if (n >= 0) {
      bin.exit(`[${n}]: body.plain`);
      return;
    }
  })();

  (() => {
    const x: SchemaTs[] = [{ path: '', title: 'title', method: 'POST', res: {}, body: { type: 'byte' } }];
    const n = x.findIndex(e => !validate(e));
    if (n >= 0) {
      bin.exit(`[${n}]: body.byte`);
      return;
    }
  })();
}

/**
 * 未实际使用，内部原数据还是把 body 当做 Complex 处理
 */
// type BodyMeta<C, S> = {
//   [K in keyof ContentTypes]: ContentTypes[K]['type'] extends { type?: infer T; data?: infer D }
//     ? {
//         type: T;
//         data: D extends Record<string, string> ? C : D extends string ? S : D extends JSONData ? C | S : never;
//       }
//     : never;
// }[keyof ContentTypes];
//
// // BodyMeta
// const json_meta_1: BodyMeta<string, number> = { type: 'json', data: 1 };
// const json_meta_2: BodyMeta<string, number> = { type: 'json', data: '1' };
// const map_meta_1: BodyMeta<string, number> = { type: 'map', data: '1' };
// const form_meta_1: BodyMeta<string, number> = { type: 'form', data: '1' };
// const binary_meta_1: BodyMeta<string, number> = { type: 'binary', data: 1 as never };
// const plain_meta_1: BodyMeta<string, number> = { type: 'plain', data: 1 };
// // BodyMeta - error
// const json_meta_error_1: BodyMeta<string, number> = { type: 'json', data: false };
// // BodyMeta 不好定义 type 省略的情况，错打错招，BodyMeta 内部数据刚好 type 一定会填充
// const json_meta_error_2: BodyMeta<string, number> = { data: '1' };
// const map_meta_error_1: BodyMeta<string, number> = { type: 'map', data: 1 };
// const form_meta_error_1: BodyMeta<string, number> = { type: 'form', data: 1 };
// // 同 json_meta_error_2，BodyMeta 一定有 type 和 data 两个属性
// const binary_meta_error_1: BodyMeta<string, number> = { type: 'binary' };
// const plain_meta_error_1: BodyMeta<string, number> = { type: 'plain', data: '1' };
