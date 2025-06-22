# $RM_type

简体中文 | [English](https://github.com/yangfanzn/json2any/blob/main/packages/$RM_type/README.en-US.md)

$RM_desc

## 支持的语言
### 已支持
| [dart@3](https://dart.dev/) | [arkTs@12](https://developer.huawei.com/consumer/cn/arkts/) | [typescript@5](https://www.typescriptlang.org/) | [kotlin@1](https://kotlinlang.org/) |

### 将会支持
| [swift](https://developer.apple.com/swift/) | [java](https://dev.java/) | [其他语言陆续支持]() |

## 安装

- ### `✅ 推荐` node npm npx 开发环境
> npx 需要 node 环境，请先安装 node
```sh
npx $RM_type build -l dart@3
```

- ### Flutter、Dart 开发环境
```sh
dart pub add dev:$RM_type
dart run $RM_type build -l dart@3
```

- ### 鸿蒙开发环境
> _由于 `OpenHarmony三方库中心仓` 发布限制，从 `v0.0.14` 版本开始将无法再直接提供独立的可执行文件，改为提供 js 脚本，
> 由 `node` 解释执行。幸运的是，`OpenHarmony 开发者工具`和`DevEco-Studio`自带 `node`，将其设置到 `PATH` 环境变量中即可_
> - _`OpenHarmony 开发者工具` 中的 `node` 通常在如下路径：command-line-tools/tool/node/bin/node_
> - _`DevEco-Studio` 中的 `node` 通常在如下路径：DevEco-Studio.app/Contents/tools/node/bin/node_
>
> _以上方法略显麻烦，所以还是推荐您使用 `npx` 方式，简单快捷_

> 将如下配置写入 oh-package.json5
```json5
{
  "scripts": {
    "$RM_type": "node ./oh_modules/$RM_type/src/main/resources/rawfile/$RM_type build -l arkTs@12",
  }
}
```
执行如下命令进行安装
```sh
ohpm install $RM_type --save-dev
ohpm run $RM_type
```
