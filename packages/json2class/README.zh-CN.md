# json2class

json2class 是一个命令行工具，可以将指定的 json 文件转换成 class 对象，该 class 对象具备序列化与反序列化能力。

简体中文 | [English](README.md)

## 支持的语言
### 已支持
| [dart@3](https://dart.dev/) |

### 将会支持
| [arkTs](https://developer.huawei.com/consumer/cn/arkts/) | [typescript](https://www.typescriptlang.org/) | [其他语言陆续支持]() |


## 安装

### javaScript、typescript 前端技术栈开发者
```sh
npx json2class build -h
```

### 其他技术栈开发者

## 快速开始
json 文件支持 json 和 json5。
```json5
// ~/projects/test/test.json
{
  "test": {
    "number": 1,
    "string": "test",
    "boolean": true,
    "arr": ["test"],
    "object": { "nextNumber": "" }
  }
}
```

默认会在执行命令的当前目录进行 json 配置的搜索及转换。
```sh
cd ~/projects/test/
npx json2class build -l dart@3
```

## json 配置说明
### 类名
```json5
// root.json5
{
  level1: {
    level2: {
      test: 1
    }
  }
}
```
生成的类名将根据层级结构逐层拼接，上面这个示例中的 level2 将生成如下类名，
这样的拼接方式，将可能发生重名的风险，如果真的发生了，构建时会抛出错误，需要使用者自行规避。
```dart
class rootlevel1level2 {
  num test = 0;
}
```

### 类型
json 配置的值是什么不重要，值的类型很重要，将决定 class 中属性的类型，
虽然 null 也是合法的 json 值，但如果配置了 null，该字段将被忽略。
```json
{
  "test": null
}
```
数组的类型由数组中的第一个元素决定，如果配置的是一个空数组，该字段将被忽略。
```json
{
  "test": []
}
```

### 默认值
为了避免在使用时繁琐的对 null 进行非空判断，生成 class 属性会根据其类型设置一个默认值。

| 类型  | 默认值   |
|-----|-------|
| 字符串 | ''    |
| 布尔值 | false |
| 数值  | 0     |
| 数组  | []    |
| 对象  | 该对象实例 |


如果不想设置默认值，可以在 json 字段末尾设置 `?`，那么该属性将会被设置成 null。
```json5
{
  'test?': 1
}
```

### 引用
可以使用 `{ "$ref": "/filename#/yyy" }` 引用一个已经定义的结构。

通过引用自身的父级，可以生成递归类型。
```json5
// filename.json5
{
  test: {
    t1: 1,
    t2: "a",
    child: {
      "$ref": "/filename#/test"
    }
  }
}
```

也可以引用另外一个 json 文件中的某个结构。
```json5
// filename1.json5
{
  test: {
    t1: 1,
    t2: "a",
  }
}
```
```json5
// filename2.json5
{
  test: {
    t1: 1,
    t2: "a",
    child: {
      "$ref": "/filename1#/test"
    }
  }
}
```

json 文件是可以使用文件夹来组织的，最多支持三层，引用时，也需要指明文件夹路径进行引用
```json5
// ./dir1/filename.json5
{
  test: {
    t1: 1,
    t2: "a",
  }
}
```
```json5
// ./dir2/filename.json5
{
  test: {
    t1: 1,
    t2: "a",
    child: {
      "$ref": "/dir1/filename#/test"
    }
  }
}
```

### 不支持的情形
json 文件中不能是一个简单类型，如下情形，在构建时会抛出错误：

`AssertError: simple must have a parent type`

```json5
// test.json
1
```
```json5
// test.json
"test"
```
```json5
// test.json
true
```
```json5
// test.json
[true]
```

引用时必须引用一个对象类型，引用一个简单类型会在构建时抛出错误：

`AssertError: the reference address does not exist`
```json5
// test.json
{
  x: 1,
  test: {
    "$ref": '/test#/x'
  }
}
```

禁止引用自身
```json5
// test.json
{
  self: {
    "$ref": '/test#/self'
  }
}
```

禁止引用一个"引用"
```json5
// test.json
{
  ref1: { test: 123 },
  ref2: {
    "$ref": "/test#/ref1"
  },
  ref3: {
    "$ref": '/test#/ref2'
  }
}
```





## 生成代码的使用


## 命令行其他选项
### 指定 json 配置文件的查找目录
```sh
npx json2class build -l dart@3 -s ~/projects/test/
```

### 指定 class 文件生成目录
默认会在 json 配置的查找目录下生成 class 文件
```sh
cd ~/projects/test/
npx json2class build -l dart@3 -o ../cache/
```
指定 -o 参数，可以指定一个输出目录，通常建议将该目录或生成的文件加入 .gitignore
```gitignore
# .gitignore
~/projects/cache/
json2class.*
```
