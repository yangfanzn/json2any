# $RM_type

简体中文 | [English](https://github.com/yangfanzn/json2any/blob/main/packages/$RM_type/README.en-US.md)

$RM_desc

## 支持的语言
### 已支持
| [arkTs@12](https://developer.huawei.com/consumer/cn/arkts/) | [dart@3](https://dart.dev/) |

### 将会支持
| [typescript](https://www.typescriptlang.org/) | [其他语言陆续支持]() |

## 安装

### `✅ 推荐` node npm npx 开发环境
npx 需要 node 环境，请先安装 node
```sh
npx $RM_type build -l dart@3
```

### Flutter、Dart 开发环境
```sh
dart pub add dev:$RM_type
dart run $RM_type build -l dart@3
```

### 鸿蒙开发环境
将如下配置写入 oh-package.json5
```json5
{
  "scripts": {
    // windows 系统
    "$RM_type": "./oh_modules/json2class/src/main/resources/rawfile/$RM_type-win.exe build -l arkTs@12",
    // macOS 系统
    "$RM_type": "./oh_modules/json2class/src/main/resources/rawfile/$RM_type-macos build -l arkTs@12"
  }
}
```
执行如下命令进行安装
```sh
ohpm install $RM_type --save-dev
ohpm run $RM_type
```
