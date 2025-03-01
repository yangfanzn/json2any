# json2http

简体中文 | [English](https://github.com/yangfanzn/json2any/blob/main/packages/json2http/README.en-US.md)

json2http 是一个命令行工具，它依赖 json2class 将 JSON(5) 配置生成可调用的 HTTP 请求代码

## 支持的语言
### 已支持
| [arkTs@12](https://developer.huawei.com/consumer/cn/arkts/) | [dart@3](https://dart.dev/) |

### 将会支持
| [typescript](https://www.typescriptlang.org/) | [其他语言陆续支持]() |

## 安装

### `✅ 推荐` javascript、typescript 前端技术栈开发者
npx 需要 node 环境，请先安装 node。
```sh
npx json2http
```

<!-- ohpm install json2http -->
_如果您是鸿蒙开发环境，可以使用 `ohpm`，通过 `ohpm config list` 查看 `node` 及 `npx` 路径_

### Flutter、Dart 技术栈开发者
```sh
dart pub add dev:json2http
dart run json2http
```

### 其他技术栈开发者
[GitHub Release 下载](https://github.com/yangfanzn/json2any/releases)

## 快速开始

筹备发布中

In preparation for release

<!-- ohpm install json2http -->

## json 配置说明

## 生成代码的使用

## 命令行其他选项
### -l --language，指定需要构建的语言
```sh
npx json2http build -l dart@3
```

### -s, --search，指定 json 配置文件的查找目录
```sh
npx json2http build -l dart@3 -s ~/projects/test/
```

### -o, --output，指定构建文件生成目录
默认会在 json 配置的查找目录下生成 class 文件
```sh
cd ~/projects/test/
npx json2http build -l dart@3 -o ../cache/
```
指定 -o 参数，可以指定一个输出目录，通常建议将该目录或生成的文件加入 .gitignore
```gitignore
# .gitignore
~/projects/cache/
json2http.*
```

## 反馈与改进
感谢您使用本工具，为了尽快完善并发布 **1.0.0 正式版本**，我们希望听到您的意见和建议。
如果您在使用过程中遇到问题，或者有任何改进的建议，欢迎通过如下方式反馈：

- 在 [GitHub Issues](https://github.com/yangfanzn/json2any/issues) 提交问题的或建议
- 发送邮件至 Yang Fan<[yangfanzn@gmail.com](mailto:yangfanzn@gmail.com)>

您的反馈对我们非常重要，非常感谢！
