# typescript_weixin@3 微信小程序配置

- 以 **官方 - TS - 基础模版** 为例进行配置说明

## 类型库安装与配置
- 删除模版自带的类型配置，安装微信小程序官方最新类型库
```sh
rm -rf typings/
yarn add miniprogram-api-typings --dev
```

- tsconfig.json 中加入类型库配置
```json
{
  "compilerOptions": {
    "typeRoots": ["./node_modules"],
    "types": ["miniprogram-api-typings"]
  }
}
```

- 在 `project.config.json` 中开启以下选项。
```json
{
  "minified": true, // 包体积优化
  "enhance": true, // 生成的代码包含高级语法
}
```

## json2http 分包配置
- 在 miniprogram 目录下创建 json2http 子目录，用于存放生成的接口代码和 json 配置文件
```sh
mkdir -p miniprogram/json2http
```
- 在 app.json 中加入分包配置
```json
{
  "subPackages": [
    {
      "root": "json2http",
      "pages": []
    }
  ]
}
```

## json2http 代码生成
- 把用于生成代码的 json 配置文件放在 `miniprogram/json2http` 目录下，执行如下命令进行构建
```sh
npx json2http build -l typescript@5 -a typescript_weixin@3
```

## 声明 app 类型文件与实现
```sh
touch project.d.ts
```
```typescript
// project.d.ts
type JSON2HTTP = typeof import('./miniprogram/json2http/json2http');
interface IAppOption {
  json2http: Promise<JSON2HTTP>;
}
```
```typescript
// app.ts
App<IAppOption>({
  json2http: require.async('./json2http/json2http').then((e: JSON2HTTP) => {
    // 全局配置方式
    e.Json2http.setPlan = (plan: json2http.Plan) => {
      plan.baseURL = 'http://localhost:3000';
      // 其他全局配置参考主文档
    };
    return e;
  }),
});
```

## 使用
- 由于使用了分包，需要 await 获取 json2http 模块后才能使用，以下是示例代码
```ts
// 在 app 上下中，通过 this.json2http 获取 json2http 模块
const json2http = await this.json2http;

// 在非 app 上下文中，getApp() 获取 app 实例后，通过 app.json2http 获取 json2http 模块
const app = getApp<IAppOption>();
const json2http = await app.json2http;

// 发起请求
await json2http.Json2http.single.apibloodindex((p) => {
  // 单次请求的参数配置
  p.params.father = 'A';
  p.params.mother = 'O';
});
```

## 模块类型与命名空间
- `JSON2HTTP` 定义在 project.d.ts 中，属于全局类型，可以在项目中直接使用，代表了 json2http 模块的类型
- `import type * as json2http from 'path-to-miniprogram/json2http/json2http'` 导入的 json2http 模块，属于 json2http 命名空间，包含了 json2http 模块的所有导出成员
