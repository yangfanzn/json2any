# json2http

English | [简体中文](https://github.com/yangfanzn/json2any/blob/main/packages/json2http/README.zh-CN.md)

json2http is a CLI tool that relies on json2class to convert a specified JSON(5) file into HTTP request code.

## Supported Languages
### Currently Supported
| [arkTs@12](https://developer.huawei.com/consumer/cn/arkts/) | [dart@3](https://dart.dev/) | [typescript@5](https://www.typescriptlang.org/) |

### Planned Support
| [java](https://dev.java/) | [kotlin](https://kotlinlang.org/) | [swift](https://developer.apple.com/cn/swift/) | [Other languages to be supported]() |

## Installation

### `✅ Recommended` Node, npm, and npx Development Environment
npx requires a Node environment. Please install Node first.
```sh
npx json2http build -l dart@3
```

### Flutter and Dart Development Environment
```sh
dart pub add dev:json2http
dart run json2http build -l dart@3
```

### HarmonyOS Development Environment
Add the following configuration to oh-package.json5.
```json5
{
  "scripts": {
    // Windows system
    "json2http": "./oh_modules/json2class/src/main/resources/rawfile/json2http-win.exe build -l arkTs@12",
    // macOS system
    "json2http": "./oh_modules/json2class/src/main/resources/rawfile/json2http-macos build -l arkTs@12"
  }
}
```
Run the following commands to install.
```sh
ohpm install json2http --save-dev
ohpm run json2http
```

## Quick Start

筹备发布中

In preparation for release

<!-- ohpm install json2http -->

## JSON Configuration Guide

## Usage of Generated Code

## Additional Command-Line Options
### -l, --language: Specifies the target language for the build.
```sh
npx json2http build -l dart@3
```

### -s, --search: Specifies the directory to search for JSON configuration files.
```sh
npx json2http build -l dart@3 -s ~/projects/test/
```

### -o, --output: Specifies the output directory for generated files.
By default, class files are generated in the directory where the JSON configurations are located.
```sh
cd ~/projects/test/
npx json2http build -l dart@3 -o ../cache/
```
Specifying the `-o` parameter allows you to define an output directory. It is recommended to add this directory or the generated files to `.gitignore`.
```gitignore
# .gitignore
~/projects/cache/
json2http.*
```

## Feedback & Improvement
Thank you for using this tool! In order to quickly improve and release **version 1.0.0**,
we would love to hear your feedback and suggestions.
If you encounter any issues or have suggestions for improvement,
please feel free to provide feedback through the following channels:

- Submit issues or suggestions on [GitHub Issues](https://github.com/yangfanzn/json2any/issues)
- Send an email to Yang Fan<[yangfanzn@gmail.com](mailto:yangfanzn@gmail.com)>

Your feedback is extremely important to us. Thank you very much!
