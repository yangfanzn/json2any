# json2http

English | [简体中文](https://github.com/yangfanzn/json2any/blob/main/packages/json2http/README.zh-CN.md)

json2http is a CLI tool that depends on json2class for generating code from JSON(5), enabling HTTP-based requests.

## Supported Languages
### Currently Supported
| [arkTs@12](https://developer.huawei.com/consumer/cn/arkts/) | [dart@3](https://dart.dev/) |

### Planned Support
| [typescript](https://www.typescriptlang.org/) | [Other languages to be supported]() |

## Installation

### `✅ Recommend` For JavaScript/TypeScript Frontend Developers
npx requires a Node environment. Please install Node first.
```sh
npx json2http build
```

<!-- ohpm install json2http -->
_If you are working within the HarmonyOS development environment,
you may utilize `ohpm` to inspect the paths for `node` and `npx` by executing `ohpm config list`._

### For Flutter、Dart Developers
```sh
dart pub add dev:json2http
dart run json2http
```

### For Developers Using Other Tech Stacks
[GitHub Release Download](https://github.com/yangfanzn/json2any/releases)

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
