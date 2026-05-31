# json2http

简体中文 | [English](https://github.com/yangfanzn/json2any/blob/main/packages/json2http/README.en-US.md)

json2http 是一个命令行工具，它依赖 [json2class](https://github.com/yangfanzn/json2any/blob/main/packages/json2class/README.md) 将指定的 JSON(5) 文件转换成 HTTP 请求代码

## 支持的语言
### 已支持
| [dart@3](https://dart.dev/) | [arkTs@12](https://developer.huawei.com/consumer/cn/arkts/) | [typescript@5](https://www.typescriptlang.org/) | [kotlin@1.3](https://kotlinlang.org/) | [swift@5.7](https://developer.apple.com/swift/) |

### 将会支持
| [java](https://dev.java/) | [objective-c](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/ProgrammingWithObjectiveC/Introduction/Introduction.html) | [其他语言陆续支持]() |

> **typescript@5** 内置了 `typescript_axios@1`、`typescript_fetch@0`、`typescript_weixin@3` 三种 agent，其中微信小程序需要额外环境配置，详见 [typescript_weixin@3 配置说明](https://github.com/yangfanzn/json2any/blob/main/packages/json2http/doc/typescript-weixin.zh-CN.md)

## 安装

- ### `✅ 推荐` node npm npx 开发环境
> npx 需要 node 环境，请先安装 node
```sh
npx json2http build -l dart@3
```

- ### Flutter、Dart 开发环境
```sh
dart pub add dev:json2http
dart run json2http build -l dart@3
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
    "json2http": "node ./oh_modules/json2http/src/main/resources/rawfile/json2http build -l arkTs@12",
  }
}
```
执行如下命令进行安装
```sh
ohpm install json2http --save-dev
ohpm run json2http
```





## 快速开始
json 文件支持 json 和 json5。
```json5
// ~/projects/config/root.json
{
  "/api/blood/index": {
    "title": "宝宝血型计算",
    "method": "GET",
    "params": {
      "father": "",
      "mother": ""
    },
    "res": {
      "code": 0,
      "msg": "",
      "data": {
        "possible": [""],
        "impossible": [""]
      },
      "copyright": ""
    }
  }
}
```

默认会在执行命令的当前目录进行 json 配置的搜索及转换。
```sh
cd ~/projects/config/
npx json2http build -l dart@3
```

代码的使用
```dart
import 'json2http.dart';

main() async {
  // 全局配置
  Json2http.setPlan = (p) {
    p.baseURL = 'https://qqlykm.cn';
    p.process = (reply) {
      final data = reply.data;
      if (data is Map) {
        if (data['code'] != 200) {
          // 设置 error 决定是否抛出异常
          // 避免每个接口都取判断状态码
          reply.error = data['msg'];
        }
      }
    };
  };

  // 发起请求
  final plan = await Json2http.single.apibloodindex((p) {
    // 单次请求的参数配置
    p.params.father = 'A';
    p.params.mother = 'O';
  });

  // 返回值
  print(plan.res.toJson());
  print(plan.res.msg);
  print(plan.res.data.possible.elementAtOrNull(0));
  print(plan.res.data.impossible.elementAtOrNull(0));
}
```


## json 配置说明
### 一个完整的 http 请求配置
```json5
{
  "/api/test/path": {
    "title": "接口的简短描述",
    "method": "POST",
    "headers": { "x-some-key": "" },
    "params": {
      "args1": "", "args2": "", "args3": "..."
    },
    "body": {
      "type": "json",
      "data": {
        "args4": 0, "args5": "", "args6": true, "args7": [""]
      }
    },
    "res": {
      "code": 0,
      "msg": "",
      "data": {
        "possible": [""],
        "impossible": [""]
      },
      "copyright": ""
    }
  }
}
```

### /api/test/path
- 作用：配置接口 path 地址
- 校验：必须 “/” 开头
- 必须：是

### title
- 作用：配置接口的简短描述
- 校验：必须字符串类型
- 必须：是

### method
- 作用：http method
- 校验：GET、POST、DELETE、PUT 等
- 必须：是

### headers
- 作用：http headers
- 校验：必须是 map<string, string 或 Array<string>> 类型
- 必须：否

### params
- 作用：http path 查询参数
- 校验：必须是 map<string, string | number | boolean> 类型
- 必须：否
- 示例：
```json5
{
  "/api/test/path": {
    "title": "",
    "method": "GET",
    "params": { "xxx": "", "yyy": 123, "zzz": true }
  }
}
```

### body
- 作用：http body 配置
- 校验：下属只能配置 type 和 data 两个字段
- 必须：否

### body.type
- 作用：http body 类型
- 校验：json、map、form、plain、byte
- 必须：是

### body.data [body.type = json]
- 校验：data 可以是任意合法的 json 数据
- 必须：是
- 示例：
```json5
{
  "/api/test/path1": {
    "title": "",
    "method": "POST",
    "body": {
      "type": "json",
      "data": 1,
    }
  },
  "/api/test/path2": {
    "title": "",
    "method": "POST",
    "body": {
      "type": "json",
      "data": {
        "xxx": 0, "yyy": [""], "zzz": true
      },
    }
  }
}
```

### body.data [body.type = map]
- 校验：data 必须是 map<string, string | number | boolean> 类型
- 必须：是
- 示例：
```json5
{
  "/api/test/path": {
    "title": "",
    "method": "POST",
    "body": {
      "type": "map",
      "data": { "xxx": "", "yyy": 123, "zzz": true }
    }
  }
}
```

### body.data [body.type = form]
- 校验：
1. data 下必须存在 fields 和 files 字段
2. files 字段必须是 map<string, string | Array<string>> 类型
3. fields 字段必须是 map<string, (string | number | boolean) | Array<string | number | boolean>> 类型
- 必须：是
- 示例：
```json5
{
  "/api/test/path": {
    "title": "",
    "method": "POST",
    "body": {
      "type": "form",
      "data": {
        "fields": { "xxx": "", "yyy": 123 },
        "files": { "aaa": [true], "bbb": "" },
      }
    }
  }
}
```

### body.data [body.type = plain]
- 校验：data 必须是字符串
- 必须：是
```json5
{
  "/api/test/path": {
    "title": "",
    "method": "POST",
    "body": {
      "type": "plain",
      "data": ""
    }
  }
}
```

### body.data [body.type = byte]
- 校验：data 必须是字符串
- 必须：是
```json5
{
  "/api/test/path": {
    "title": "",
    "method": "POST",
    "body": {
      "type": "byte",
      "data": ""
    }
  }
}
```

### res
- 作用：http 返回值
- 校验：任意合法的 json 对象
- 必须：否
- 示例：
```json5
{
  "/api/test/path": {
    "title": "",
    "method": "GET",
    "res": {
      "statusCode": "",
      "statusMessage": "",
      "data": { "xxx": "", "yyy": 1 }
    }
  }
}
```

## 其他配置
### 路径参数
```json5
{
  "/api/test/{user}": {
    "title": "",
    "method": "GET",
  }
}
```
```dart
main() async {
  await Json2http.single.apitestuser((p) {
    p.seg.user = 'user';
  });
}
```

### 自定义调用方法名
如果你实在不喜欢用接口地址当做方法名，也可以通过这种方式自定义方法名
```json5
{
  "apiMethodName": {
    "path": "/api/test/path",
    "title": "",
    "method": "GET",
    "params": { "xxx": "" }
  }
}
```
```dart
main() async {
  await Json2http.single.apiMethodName((p) {
    p.params.xxx = 'user';
  });
}
```

### 依赖 json2class 生成对象
- params
- body.data
- body.data.fields
- body.data.files
- res

以上字段生成的代码都会继承`json2class`，对应值的配置和使用方法遵循 [json2class](https://github.com/yangfanzn/json2any/blob/main/packages/json2class/README.md)，如：

- 如何设置字段可选
- 如何设置填充方式
- 包括生成代码的使用方式也完全一致

### 引用一个存在的结构
和`json2class`类似，`json2http`的配置也可以通过`{ $meta: { ref: '' } }`引用一个已经存在的结构。
不同的是，当引用与当前不同的父级结构时，`json2class`是以文件为基本单元，而`json2http`以`接口`为基本单元

如下示例中，接口`/api/test/path2` 中的`res`可以复用 `/api/test/path1`中的`res`
```json5
{
  "/api/test/path1": {
    "title": "",
    "method": "GET",
    "res": {
      "xxx": ""
    }
  },
  "/api/test/path2": {
    "title": "",
    "method": "GET",
    "res": {
      "$meta": { "ref": "/api/test/path1#/res" }
    }
  }
}
```
如果引用发生在当前接口中，则当前接口地址可以省略
```json5
{
  "/api/test/path": {
    "title": "",
    "method": "GET",
    "params": { "xxx": "" },
    "res": {
      "$meta": { "ref": "#/params" }
    }
  }
}
```
通过引用自身的父级，可以生成递归类型
```json5
{
  "/api/test/path": {
    "title": "",
    "method": "GET",
    "res": {
      "someKey": "",
      "child": {
        "": { "ref": "#/res" }
      } 
    }
  }
}
```

### 设置参数可选
- body.data [body.type = json]
- body.data [body.type = byte]
- body.data [body.type = plain]

这三种情况下，可以给 data 设置 `?` 标记，生成的代码可以给 data 设置 `null`

```json5
{
  "/api/test/path": {
    "title": "",
    "method": "POST",
    "body": {
      "type": "json",
      "data?": 1
    }
  }
}
```
```dart
main() async {
  await Json2http.single.apitestpath((p) {
    p.body.data = null;
  });
}
```

## 生成代码的使用

### 全局入口 Json2http

- Json2http.setPlan
```dart
import 'json2http.dart';

// 可以自定义 Agent，完全控制请求调用行为
class XAgent extends Agent {
  Future<Reply> fetch(Plan plan) async {
    // 可以参照已经生成的代码中进行实现
    plan.reply.data = {'statusCode': '0'};
    plan.reply.code = 200;
    return plan.reply;
  }
  body(Plan plan) {
    // 可以参照已经生成的代码中进行实现
    return null;
  }
}

main() {
  Json2http.setPlan = (plan) {
    // 全局配置
    plan.baseURL = 'http://localhost:3000';
    plan.process = (reply) {
      final data = reply.data;
      if (data is Map) {
        if (data['statusCode'] != '0') {
          // 决定最终请求是否抛出异常
          reply.error = data['statusMessage'];
        }
      }
    };
    
    plan.ready = () {
      // 设置原始请求工具中的原始配置
      plan.option = xxx;
      // 设置原始请求工具
      plan.session = xxx;
    };

    if (plan is testagentplan) {
      plan.agent = XAgent();
    }

    if (plan.title.startsWith('amap:')) {
      // 特殊接口特殊配置
      plan.baseURL = 'https://restapi.amap.com/v3';
      plan.path = '${plan.path}?key=xxx';
      plan.process = (reply) {
        var data = reply.data;
        if (data is Map) {
          if (data['status'] != '1') {
            reply.error = data['info'];
          }
        }
      };
    }
    
    if (plan is refreshtestplan) {
      plan.after = () async {
        if (plan.reply.error == 'small token is error') {
          // 实现 token 刷新
          final x = await Json2http.single.refreshtoken((p) {
            p.headers = {'access-token': 'bearer xxx'};
          });
          // 重新设置 token 后，接口重试
          plan.headers['access-token'] = x.res.data;
          await plan.fetch();
        }
      };
    }
  };
}
```

- 发起接口调用
```json5
{
  "/api/blood/index": {
    "title": "宝宝血型计算",
    "method": "GET",
    "params": {
      "father": "",
      "mother": ""
    },
    "res": {
      "code": 0,
      "msg": "",
      "data": {
        "possible": [""],
        "impossible": [""]
      },
      "copyright": ""
    }
  }
}
```
```dart
main() async {
  final result = await Json2http.single.apibloodindex((plan) {
    plan.params.father = 'A';
    plan.params.mother = 'B';
  });
}
```

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
感谢您使用本工具，我们希望听到您的意见和建议。
如果您在使用过程中遇到问题，或者有任何改进的建议，欢迎通过如下方式反馈：

- 在 [GitHub Issues](https://github.com/yangfanzn/json2any/issues) 提交问题的或建议
- 发送邮件至 Yang Fan<[yangfanzn@gmail.com](mailto:yangfanzn@gmail.com)>

您的反馈对我们非常重要，非常感谢！
