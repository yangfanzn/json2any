$RM_header
@RM_desc:json2http 是一个命令行工具，它依赖 json2class 将指定的 JSON(5) 文件转换成 HTTP 请求代码@
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
- 校验：GET、POST、DELETE、PUT
- 必须：是

### headers
- 作用：http headers
- 校验：必须是 map<string, string 或 Array<string>> 类型
- 必须：否

### params
- 作用：http path 查询参数
- 校验：必须是 map<string, string> 类型
- 必须：否
- 示例：
```json5
{
  "/api/test/path": {
    "title": "",
    "method": "GET",
    "params": { "xxx": "", "yyy": "" }
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
- 校验：data 必须是 map<string, string> 类型
- 必须：是
- 示例：
```json5
{
  "/api/test/path": {
    "title": "",
    "method": "POST",
    "body": {
      "type": "map",
      "data": { "xxx": "", "yyy": "" }
    }
  }
}
```

### body.data [body.type = form]
- 校验：
1. data 下必须存在 fields 和 files 字段
2. fields 和 files 字段必须是 map<string, string 或 Array<string>> 类型
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
        "fields": { "xxx": "", "yyy": "" },
        "files": { "aaa": [""], "bbb": "" },
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
        "$mate": { "ref": "#/res" }
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

$RM_footer
