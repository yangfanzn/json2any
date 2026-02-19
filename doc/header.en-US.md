# $RM_type

English | [简体中文](https://github.com/yangfanzn/json2any/blob/main/packages/$RM_type/README.zh-CN.md)

$RM_desc

## Supported Languages
### Currently Supported
| [dart@3](https://dart.dev/) | [arkTs@12](https://developer.huawei.com/consumer/cn/arkts/) | [typescript@5](https://www.typescriptlang.org/) | [kotlin@1.3](https://kotlinlang.org/) | [swift@5.7](https://developer.apple.com/swift/) |

### Planned Support
| [java](https://dev.java/) | [Other languages to be supported]() |

## Installation

- ### `✅ Recommended` Node, npm, and npx Development Environment
> npx requires a Node environment. Please install Node first.
```sh
npx $RM_type build -l dart@3
```

- ### Flutter and Dart Development Environment
```sh
dart pub add dev:$RM_type
dart run $RM_type build -l dart@3
```

- ### HarmonyOS Development Environment
> _Due to the release restrictions of `OpenHarmony Third-party Library Center`, from version `v0.0.14`, 
> independent executable files are no longer provided. Instead, JS scripts are provided and executed by `node`. 
> Fortunately, `OpenHarmony Developer Tools` and `DevEco-Studio` come with `node`. Just add it to the `PATH` environment variable._
> - _`OpenHarmony Developer Tools`'s `node` is usually at: command-line-tools/tool/node/bin/node_
> - _`DevEco-Studio`'s `node` is usually at: DevEco-Studio.app/Contents/tools/node/bin/node_
>
> _The above methods are a bit cumbersome, so it is still recommended to use the npx method for simplicity._

> Add the following configuration to oh-package.json5.
```json5
{
  "scripts": {
    "$RM_type": "node ./oh_modules/$RM_type/src/main/resources/rawfile/$RM_type build -l arkTs@12",
  }
}
```
Run the following commands to install.
```sh
ohpm install $RM_type --save-dev
ohpm run $RM_type
```
