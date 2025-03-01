# $RM_type

English | [简体中文](https://github.com/yangfanzn/json2any/blob/main/packages/$RM_type/README.zh-CN.md)

$RM_desc

## Supported Languages
### Currently Supported
| [arkTs@12](https://developer.huawei.com/consumer/cn/arkts/) | [dart@3](https://dart.dev/) |

### Planned Support
| [typescript](https://www.typescriptlang.org/) | [Other languages to be supported]() |

## Installation

### `✅ Recommended` Node, npm, and npx Development Environment
npx requires a Node environment. Please install Node first.
```sh
npx $RM_type build -l dart@3
```

### Flutter and Dart Development Environment
```sh
dart pub add dev:$RM_type
dart run $RM_type build -l dart@3
```

### HarmonyOS Development Environment
Add the following configuration to oh-package.json5.
```json5
{
  "scripts": {
    // Windows system
    "$RM_type": "./oh_modules/json2class/src/main/resources/rawfile/$RM_type-win.exe build -l arkTs@12",
    // macOS system
    "$RM_type": "./oh_modules/json2class/src/main/resources/rawfile/$RM_type-macos build -l arkTs@12"
  }
}
```
Run the following commands to install.
```sh
ohpm install $RM_type --save-dev
ohpm run $RM_type
```
