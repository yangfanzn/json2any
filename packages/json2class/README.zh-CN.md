# json2class

json2class 是一个命令行工具，可以将指定的 json 文件转换成 class 对象，该 class 对象具备序列化与反序列化能力。

简体中文 | [English](https://github.com/yangfanzn/json2any/blob/main/packages/json2class/README.en-US.md)


## 反馈与改进
感谢您使用本工具，为了尽快完善并发布 **1.0.0 正式版本**，我们希望听到您的意见和建议。
如果您在使用过程中遇到问题，或者有任何改进的建议，欢迎通过如下方式反馈：

- 在 [GitHub Issues](https://github.com/yangfanzn/json2any/issues) 提交问题的或建议
- 发送邮件至 Yang Fan<[yangfanzn@gmail.com](mailto:yangfanzn@gmail.com)>

您的反馈对我们非常重要，非常感谢！

## 支持的语言
### 已支持
| [arkTs@12](https://developer.huawei.com/consumer/cn/arkts/) | [dart@3](https://dart.dev/) |

### 将会支持
| [typescript](https://www.typescriptlang.org/) | [其他语言陆续支持]() |

## 安装

### `✅ 推荐` javascript、typescript 前端技术栈开发者
npx 需要 node 环境，请先安装 node。
```sh
npx json2class
```

<!-- ohpm install json2class -->
_如果您是鸿蒙开发环境，可以使用 `ohpm`，可以通过 `ohpm config list` 查看自动的 `node` 及 `npx` 路径_

### Flutter、Dart 技术栈开发者
```sh
dart pub add dev:json2class
dart run json2class
```

### 其他技术栈开发者
[GitHub Release 下载](https://github.com/yangfanzn/json2any/releases)

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
生成的类名将根据层级结构逐层拼接，上面这个示例中的 `level2` 将生成如下类名，
这样的拼接方式，将可能发生重名的风险，如果真的发生了，构建时会抛出错误，改变 json 文件名既可规避类名冲突。
```dart
class rootlevel1level2 extends json2class {
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

<a id="defaultValue"></a>
### 默认值
为了避免在使用时繁琐的对 null 进行非空判断，生成 class 属性会根据其类型设置一个默认值。

| 类型  | 默认值   |
|-----|-------|
| 字符串 | ''    |
| 布尔值 | false |
| 数值  | 0     |
| 数组  | []    |
| 对象  | 该对象实例 |


如果不想设置默认值，可以在 json 字段末尾设置 `?`，那么该属性将会被设置成 `null`。
```json5
{
  'test?': 1
}
```
类型为数组，`test?`表示`test`属性是否可以被设置为`null`。
数组中的第一个元素标注数组的类型，数组中的第二个元素如果为`null`，标记数组元素是否可以设置为`null`。
```json5
{
  'test?': ['', null]
}
```

### 引用
可以使用 `{ "$meta": { "ref": "/filename#/yyy" } }` 引用一个已经定义的结构。

通过引用自身的父级，可以生成递归类型。
```json5
// filename.json5
{
  test: {
    t1: 1,
    t2: "a",
    child: {
      "$meta": {
        "ref": "/filename#/test"
      }
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
      "$meta": { ref: "/filename1#/test" }
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
      "$meta": { ref: "/dir1/filename#/test" }
    }
  }
}
```

## 生成代码的使用
### 核心方法
| 方法名        | 参数  | 返回值  | 说明                             |
|------------|-----|------|--------------------------------|
| fromJson   | Map | 当前对象 | 将 Map 数据按数据类型填充到当前对象中          |
| fromAny    | 任意值 | 当前对象 | 将任意数据尝试解析成 Map 后调用 `fromJson`  |
| fromPreset | -   | 当前对象 | 读取配置 json 文件中的预设数据调用 `fromAny` |
| toJson     | -   | Map  | 将当前对象中的数据转换成 Map               |
| toNew      | -   | 新对象  | 创建当前对象的全新实例                    |

### 数据填充规则
- **DiffType** 输入字段类型不一致

| 枚举值     | 效果                     |
|---------|------------------------|
| Keep    | 保持原值                   |
| Default | 设置[默认值](#defaultValue) |
| Null    | 设置 `null`（必选字段设置默认值）   |

- **MissKey** 输入字段不存在

| 枚举值     | 效果                     |
|---------|------------------------|
| Keep    | 保持原值                   |
| Default | 设置[默认值](#defaultValue) |
| Null    | 设置 `null`（必选字段设置默认值）   |

- **MoreIndex** 输入数组长度 > 原数组

| 枚举值  | 效果                                                     |
|------|--------------------------------------------------------|
| Fill | 按输入值插入，类型不一致时，根据字段是否可选，设置[默认值](#defaultValue) / `null` |
| Drop | 丢弃多余的输入数据，数组长度与原数组长度一致                                 |
| Null | 多出的数据填充为 `null` 值（非可选字段强制 `Null` 等同 `Fill`）            |

- **MissIndex** 数组数组长度 < 原数组

| 枚举值  | 效果                                          |
|------|---------------------------------------------|
| Fill | 填充默认值，多维数组会递归填充                             |
| Drop | 丢弃多余的原始数据，数组长度与输入数组长度一致                     |
| Null | 多出的数据填充为 `null` 值（非可选字段强制 `Null` 等同 `Fill`） |
| Skip | 原数组中多余的数据不做处理，保留原值                          |

### 如何设置规则
- **全局设置**
```
Json2class.defaultRule.missKey = MissKey.Null;
```

- **默认全局配置**

| 枚举类型      | 默认值            |
|-----------|----------------|
| DiffType  | DiffType.Null  |
| MissKey   | MissKey.Null   |
| MoreIndex | MoreIndex.Fill |
| MissIndex | MissIndex.Skip |

- **当前实例设置**
```
obj.rule = new Rule();
```

- **当前转换的设置**
```
Json2class fromAny(dynamic data, {void Function(Rule rule)? setRule, Rule? rule})
Json2class fromJson(dynamic data, {void Function(Rule rule)? setRule, Rule? rule})
Json2class fromPreset({void Function(Rule rule)? setRule, Rule? rule})
```

## 命令行其他选项
### -l --language，指定需要构建的语言
```sh
npx json2class build -l dart@3
```

### -s, --search，指定 json 配置文件的查找目录
```sh
npx json2class build -l dart@3 -s ~/projects/test/
```

### -o, --output，指定构建文件生成目录
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
