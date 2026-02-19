$RM_header
@RM_desc:json2http is a command-line tool that relies on [json2class](https://github.com/yangfanzn/json2any/blob/main/packages/json2class/README.md) to convert specified JSON(5) files into HTTP request code.@
## Quick Start
JSON files support both json and json5 formats.
```json5
// ~/projects/config/root.json
{
  '/api/blood/index': {
    title: 'Baby blood type calculation',
    method: 'GET',
    params: {
      father: '',
      mother: '',
    },
    res: {
      code: 0,
      msg: '',
      data: {
        possible: [''],
        impossible: [''],
      },
      copyright: '',
    },
  },
}
```

By default, it searches for and converts json configurations in the current directory where the command is executed.
```sh
cd ~/projects/config/
npx json2http build -l dart@3
```

Usage of Code
```dart
import 'json2http.dart';

main() async {
  // Global configuration
  Json2http.setPlan = (p) {
    p.baseURL = 'https://qqlykm.cn';
    p.process = (reply) {
      final data = reply.data;
      if (data is Map) {
        if (data['code'] != 200) {
          // Set error to determine whether to throw an exception
          // Avoid checking status code for every interface
          reply.error = data['msg'];
        }
      }
    };
  };

  // Initiate request
  final plan = await Json2http.single.apibloodindex((p) {
    // Parameter configuration for a single request
    p.params.father = 'A';
    p.params.mother = 'O';
  });

  // Return value
  print(plan.res.toJson());
  print(plan.res.msg);
  print(plan.res.data.possible.elementAtOrNull(0));
  print(plan.res.data.impossible.elementAtOrNull(0));
}
```

## JSON Configuration
### A Complete HTTP Request Configuration
```json5
{
  '/api/test/path': {
    title: 'Short description of the interface',
    method: 'POST',
    headers: { 'x-some-key': '' },
    params: {
      args1: '', args2: '', args3: '...'
    },
    body: {
      type: 'json',
      data: {
        args4: 0, args5: '', args6: true, args7: [''],
      },
    },
    res: {
      code: 0,
      msg: '',
      data: {
        possible: [''],
        impossible: [''],
      },
      copyright: '',
    },
  },
}
```

### /api/test/path
- Description: Configure the interface path address
- Validation: Must start with "/"
- Required: Yes

### title
- Description: Configure a short description of the interface
- Validation: Must be a string
- Required: Yes

### method
- Description: http method
- Validation: GET, POST, DELETE, PUT, etc.
- Required: Yes

### headers
- Description: http headers
- Validation: Must be map<string, string or Array<string>> type
- Required: No

### params
- Description: http path query parameters
- Validation: Must be map<string, string | number | boolean> type
- Required: No
- Example:
```json5
{
  '/api/test/path': {
    title: '',
    method: 'GET',
    params: { xxx: '', yyy: 123, zzz: true },
  },
}
```

### body
- Description: http body configuration
- Validation: Can only configure type and data fields under it
- Required: No

### body.type
- Description: http body type
- Validation: json, map, form, plain, byte
- Required: Yes

### body.data [body.type = json]
- Validation: data can be any valid json data
- Required: Yes
- Example:
```json5
{
  '/api/test/path1': {
    title: '',
    method: 'POST',
    body: {
      type: 'json',
      data: 1,
    },
  },
  '/api/test/path2': {
    title: '',
    method: 'POST',
    body: {
      type: 'json',
      data: {
        xxx: 0, yyy: [''],  zzz: true
      },
    },
  },
}
```

### body.data [body.type = map]
- Validation: data must be map<string, string | number | boolean> type
- Required: Yes
- Example:
```json5
{
  '/api/test/path': {
    title: '',
    method: 'POST',
    body: {
      type: 'map',
      data: { xxx: '', yyy: 123, zzz: true },
    },
  },
}
```

### body.data [body.type = form]
- Validation:
1. data must contain fields and files fields
2. files field must be map<string, string | Array<string>> type
3. fields field must be map<string, (string | number | boolean) | Array<string | number | boolean>> type
- Required: Yes
- Example:
```json5
{
  '/api/test/path': {
    title: '',
    method: 'POST',
    body: {
      type: 'form',
      data: {
        fields: { xxx: '', yyy: 123 },
        files: { aaa: [true], bbb: '' },
      },
    },
  },
}
```

### body.data [body.type = plain]
- Validation: data must be a string
- Required: Yes
```json5
{
  '/api/test/path': {
    title: '',
    method: 'POST',
    body: {
      type: 'plain',
      data: '',
    },
  },
}
```

### body.data [body.type = byte]
- Validation: data must be a string
- Required: Yes
```json5
{
  '/api/test/path': {
    title: '',
    method: 'POST',
    body: {
      type: 'byte',
      data: '',
    },
  },
}
```

### res
- Description: http return value
- Validation: Any valid json object
- Required: No
- Example:
```json5
{
  '/api/test/path': {
    title: '',
    method: 'GET',
    res: {
      statusCode: '',
      statusMessage: '',
      data: { xxx: '', yyy: 1 },
    },
  },
}
```

## Other Configurations
### Path Parameters
```json5
{
  '/api/test/{user}': {
    title: '',
    method: 'GET',
  },
}
```
```dart
main() async {
  await Json2http.single.apitestuser((p) {
    p.seg.user = 'user';
  });
}
```

### Custom Method Name
If you really don't like using the interface address as the method name, you can also customize the method name in this way.
```json5
{
  apiMethodName: {
    path: '/api/test/path',
    title: '',
    method: 'GET',
    params: { xxx: '' },
  },
}
```
```dart
main() async {
  await Json2http.single.apiMethodName((p) {
    p.params.xxx = 'user';
  });
}
```

### Rely on json2class to generate objects
- params
- body.data
- body.data.fields
- body.data.files
- res

The code generated for the above fields will inherit `json2class`, and the configuration and usage of the corresponding values follow [json2class](https://github.com/yangfanzn/json2any/blob/main/packages/json2class/README.md), such as:

- How to set fields as optional
- How to set filling methods
- The usage of the generated code is also completely consistent

### Referencing an Existing Structure
Similar to `json2class`, the configuration of `json2http` can also reference an existing structure through `{ $meta: { ref: '' } }`.
The difference is that when referencing a parent structure different from the current one, `json2class` uses the file as the basic unit, while `json2http` uses the `interface` as the basic unit.

In the following example, `res` in interface `/api/test/path2` can reuse `res` in `/api/test/path1`.
```json5
{
  '/api/test/path1': {
    title: '',
    method: 'GET',
    res: {
      xxx: '',
    },
  },
  '/api/test/path2': {
    title: '',
    method: 'GET',
    res: {
      $meta: { ref: '/api/test/path1#/res' },
    },
  },
}
```
If the reference occurs in the current interface, the current interface address can be omitted.
```json5
{
  '/api/test/path': {
    title: '',
    method: 'GET',
    params: { xxx: '' },
    res: {
      $meta: { ref: '#/params' },
    },
  },
}
```
By referencing its own parent, recursive types can be generated.
```json5
{
  '/api/test/path': {
    title: '',
    method: 'GET',
    res: {
      someKey: '',
      child: {
        $mate: { ref: '#/res' },
      },
    },
  },
}
```

### Setting Parameters Optional
- body.data [body.type = json]
- body.data [body.type = byte]
- body.data [body.type = plain]

In these three cases, you can set `?` mark for data, and the generated code can set data to `null`.

```json5
{
  '/api/test/path': {
    title: '',
    method: 'POST',
    body: {
      type: 'json',
      'data?': 1,
    },
  },
}
```
```dart
main() async {
  await Json2http.single.apitestpath((p) {
    p.body.data = null;
  });
}
```

## Usage of Generated Code

### Global Entry Json2http

- Json2http.setPlan
```dart
import 'json2http.dart';

// You can customize the Agent to fully control the request call behavior
class XAgent extends Agent {
  Future<Reply> fetch(Plan plan) async {
    // Can be implemented based on the generated code
    plan.reply.data = {'statusCode': '0'};
    plan.reply.code = 200;
    return plan.reply;
  }
  body(Plan plan) {
    // Can be implemented based on the generated code
    return null;
  }
}

main() {
  Json2http.setPlan = (plan) {
    // Global configuration
    plan.baseURL = 'http://localhost:3000';
    plan.process = (reply) {
      final data = reply.data;
      if (data is Map) {
        if (data['statusCode'] != '0') {
          // Determine whether the final request throws an exception
          reply.error = data['statusMessage'];
        }
      }
    };

    plan.ready = () {
      // Set the original configuration in the original request tool
      plan.option = xxx;
      // Set the original request tool
      plan.session = xxx;
    };

    if (plan is testagentplan) {
      plan.agent = XAgent();
    }

    if (plan.title.startsWith('amap:')) {
      // Special interface special configuration
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
          // Implement token refresh
          final x = await Json2http.single.refreshtoken((p) {
            p.headers = {'access-token': 'bearer xxx'};
          });
          // After re-setting the token, retry the interface
          plan.headers['access-token'] = x.res.data;
          await plan.fetch();
        }
      };
    }
  };
}
```

- Initiate interface call
```json5
{
  '/api/blood/index': {
    title: 'Baby blood type calculation',
    method: 'GET',
    params: {
      father: '',
      mother: '',
    },
    res: {
      code: 0,
      msg: '',
      data: {
        possible: [''],
        impossible: [''],
      },
      copyright: '',
    },
  },
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

$RM_footer
