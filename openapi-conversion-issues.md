# OpenAPI 转 json2http 配置问题清单

## 关于本文档

> **写给未来的 AI / 开发者**：本文档是 json2http 的 OpenAPI 转换问题清单。下面先介绍 json2http 是什么、源代码怎么组织、整个转换管线怎么运转——读完你就能理解每一条 issue 在讨论什么，继续查漏补缺。

---

## json2http 概览

**json2http** 是一个多语言 HTTP 客户端代码生成工具。它读入一份 **json2http 配置**（一个精简的接口描述 JSON），为每个接口生成一个类型安全的 `Plan` 类——包含请求参数、请求体、响应体的完整类型定义，以及 `request()` 执行方法。

它的上游有两种配置来源：

1. **手写 JSON(5) 配置文件**：开发者按 json2http 配置标准手工编写，适合新项目或精确控制生成结果。
2. **OpenAPI 3.x 规范文件**：由 `base/openapi.ts` 自动转换而来——这正是本文档关注的链路。

支持的目标语言与 HTTP 客户端：

| 语言 | 默认 Agent（HTTP 客户端） |
|------|--------------------------|
| ArkTS (HarmonyOS) | RCP、Axios、Fetch、Weixin |
| Dart | Dio |
| Kotlin | OkHttp |
| Swift | Alamofire |
| TypeScript | Axios、Fetch、Weixin |

---

## 源代码结构

整个 json2http 的源码在 `packages/json2http/src/` 下，分两层：

### `base/` —— 语言无关的核心层

| 文件 | 职责 |
|------|------|
| `base/openapi.ts` | **OpenAPI 3.x → json2http 配置**的转换器。`OpenApi` 类接收一份 OpenAPI spec JSON，`parse()` 方法遍历 `paths`，逐接口提取 `title` / `method` / `path` / `params` / `body` / `res`，输出 json2http 配置 JSON 字符串。这是本文档关注的核心文件。 |
| `base/schema.ts` + `schema-2020-12.json` | **json2http 配置标准**。定义了 `SchemaPlan` 类型（`path` / `method` / `title` / `params` / `body` / `res` / `headers` / `seg`），以及基于 Ajv2020 的 JSON Schema 校验。所有转换结果和手写配置都需通过 `validate()` 校验。 |
| `base/code.ts` | **代码生成抽象基类**。`Http` 抽象类定义了 `toLaunch(plan)` → `toCode()` 的生成管线，统一处理 JSON Schema → 目标语言类型声明、ref 解析、依赖收集。 |
| `base/func.ts` | 工具函数（关键字转换、类型判断等）。 |
| `base/type.ts` | 语言 / Agent 枚举（`Language`、`DefaultAgent`）。 |

### 各目标语言目录 —— 代码生成 + HTTP Agent

每个目标语言（`arkTs/`、`dart/`、`kotlin/`、`swift/`）包含：

- **`code.ts`**：继承 `Http`，实现 `toLaunch()`，输出该语言的 `Plan` 类代码。`Plan` 是一个抽象类，包含：
  - 抽象字段：`path`、`method`、`title`、`params`、`body`、`res`、`headers`、`seg`
  - 运行时方法：`request()`（按 `before → fetch → after` 生命周期执行）、`fetch()`、`abort()`
  - 生命周期钩子：`start?` / `before?` / `ready?` / `process?` / `after?` / `end?`
  - 静态全局切面：`Json2http.setPlan` ——可对所有 Plan 统一注入逻辑（如鉴权 header）
- **`agent/`**：HTTP 客户端实现（如 `axios.ts`、`fetch.ts`、`rcp.ts`）。Agent 负责实际发起请求，并在运行时自动注入 `Content-Type` 等 header。

---

## json2http 的 `$ref` 设计：复用「接口本身已存在的结构」

> 这是理解 `openapi.ts` 中 `$ref` 处理逻辑的关键前提。务必先读懂，否则会误判一批"非缺陷"为缺陷。

### 核心设计

json2http 配置里**没有"独立组件定义区"**（不像 OpenAPI 有 `components/schemas` 这种集中定义的命名空间）。它表达"复用"的方式是 **`$meta.ref` 指向某个接口里真实存在的某个结构位置**。

也就是说：

- 一个 schema **第一次**出现的地方，就把它**内联展开**成真实结构——这份内联结构就是它的"真身"。
- 之后**再次**出现（同一接口内重复、或别的接口引用），就输出 `{ $meta: { ref: <第一次出现的 uri> } }`，指回那份已存在的结构去复用。

`uri` 形如 `/a#/res`、`/u#/body/data/buyer`，即"哪个接口、哪个位置"。**锚点寄生在接口结构上，是设计本身，不是缺陷。**

### 由此推导出的几个"看似奇怪、实则正确"的行为

以 `Node { mark, next: Node }`（自引用）被 `/a`、`/b` 两接口的响应引用为例：

```jsonc
// /a：Node 首次出现，内联展开；内部 next 回指 Node，输出 $meta.ref 指回 res 自己
"/a": { "res": { "mark": "", "next?": { "$meta": { "ref": "/a#/res" } } } }
// /b：复用 /a 已存在的 Node 结构
"/b": { "res": { "$meta": { "ref": "/a#/res" } } }
```

- **自引用 `next` 指回自己** → 符合设计（自引用就是复用自己这份结构，否则无限展开）。✅
- **`/b` 指向 `/a` 的内部位置** → 符合设计（复用别的接口已有的结构，json2http 没有独立组件区可指）。✅

### `isRes` 必须参与区分

同一个 schema 在请求体（`isRes=false`，按 `required` 判可选）与响应体（`isRes=true`，字段一律必填）下可选性规则不同，因此 `indexes` 用 `[ref, isRes]` 做 key、各自独立展开/锚定是**正确**的：req 的 `$meta.ref` 指向 req 内位置，res 的指向 res 内位置，互不串味。

> 注：`maps[ref]` 的写入 key 不带 `isRes`，但在 `useRef` 分支里 `$meta.ref` 返回的是 `indexes[k].uri`（带 `isRes`），`maps` 仅在 `useRef=false` 分支被读取。是否构成实际问题取决于 `maps` 的使用路径，**不在本节"复用接口结构"这一核心设计的讨论范围内**。

### 引用点稳定性（锚点漂移）：问题、约束与解决方向

#### 问题：锚点会漂移

`$meta.ref` 的锚点 = "该 schema 第一次出现的接口位置"，因此锚点会随两类变化漂移：

1. **顺序变化**：OpenAPI 的 paths / 字段遍历顺序变了，"第一个"就变了。
2. **接口增删**：新增一个更靠前引用该 schema 的接口，"第一个"也会变；删除当前锚点接口同理。

漂移的后果是**转换出的 json2http 配置 diff 不稳定**，以及共享类型在生成代码里的**归属/命名发生抖动**。注意：漂移是"可维护性 / 稳定性"问题，**不影响生成代码的功能正确性**。

#### 关键约束：锚点只能用「接口位置」，不能用「组件名」

为什么不直接用 OpenAPI 的组件名（`#/components/schemas/<Name>`）当稳定锚点？因为：

- **生成代码的类型名直接取自锚点。** 现实中大量工具导出的 OpenAPI，为避免组件重名，组件名带 hash（如 `DeviceInfo_a1b2c3d4`、`PageResult_OrderVO_f9e8d7`）。
- 若用组件名做锚点 → 生成类型名带 hash 尾巴，**可读性极差**；且 hash 会随后端重新生成而变，**名字本身也不稳定**。

因此「用组件名做稳定锚点」「用一个特殊接口（如 `/xxxx`）集中放公共结构再按组件名引用」这类方案**全部被否决**——它们都让 hash 组件名污染生成命名。

> 推论：锚点**必须**是接口位置（如 `/devices#/res`），命名来自路径 / 字段，可读可控。这正是当前"自引用 / 锚点寄生在接口位置"方案的根本理由，是**有意为之的正确取舍**，不是缺陷。

#### 解决方向：读上次落盘结果，按「接口位置」沿用历史锚点

既然锚点必须是接口位置，防漂移的唯一可行手段就是让**同一 schema 的锚点跨多次转换稳定落在同一接口位置**。`convert` 命令的输出会落盘（`${output}${file}.openapi@3.json`），因此可以利用历史：

1. **读历史**：`convert` 在写入前，先读上一次落盘的同名结果文件（不存在则视为空）。
2. **提取历史锚点集合**：扫历史 JSON，收集所有「被 `$meta.ref` 指向的接口位置 uri」（这些就是上次的锚点）。
3. **两趟转换**（单趟无法实现"优先历史锚点"，因为遍历到某位置时还不知道后面会不会出现历史锚点位置）：
   - 第一趟：收集每个 `[ref, isRes]` 的所有出现位置；
   - 选锚点：若出现位置中**命中历史锚点集合** → 用命中者（稳定，不漂；多命中取字典序最小）；**未命中**（新 schema 或历史锚点位置本次全消失）→ 现算一个（取出现位置**字典序最小**者）；
   - 第二趟：锚点位置内联展开，其余出现输出 `$meta.ref` 指向锚点。
4. **落盘**：本次结果成为下次的历史。

要点与边界：

- **识别口径：完全不依赖组件名**（hash 名不可靠），只依赖「接口位置 uri 是否在本次仍被同一个 `$ref` 命中」。
- **首次转换 / 无历史**：用现算规则（字典序最小）定基线，会有一次性基线确定，之后稳定。
- **未命中导致的漂移是一次性的**：本次定下并落盘后，下次即进历史锚点集合，从此稳住。
- **锚点位置内容以本次为准**：复用的只是"位置 key"，结构内容与引用关系都按本次 OpenAPI 重算，不会把旧结构错带出来。
- 与 **T1（多 method plan key 稳定性）** 耦合：多 method 时 plan key 形态变化会影响历史锚点能否对上，需一并考虑。

> 小结：在"锚点必须是接口位置"的约束下，"读上次落盘、按位置沿用历史锚点"是防漂移的可行方案，且**不需要额外元信息、不改 json2http 配置结构**——改动集中在 `convert` 入口（读历史、提取锚点）与 `OpenApi`（两趟、历史锚点入参）。

---

## 转换管线

```
OpenAPI 3.x spec (JSON)
        │
        ▼
  base/openapi.ts  ─── OpenApi.parse()
        │                遍历 paths → 逐接口提取字段
        │                paramsMerge() 合并 path 级 + operation 级参数
        │
        ▼
  json2http 配置 (JSON 字符串)
        │
        ▼
  base/schema.ts  ─── validate() 校验配置合法性
        │
        ▼
  base/code.ts  ─── Http.toCode()
        │              解析配置 → 生成类型声明 → 收集依赖
        │
        ▼
  {target}/code.ts  ─── 生成目标语言 Plan 类代码
        │
        ▼
  可编译/运行的类型安全 HTTP Client 代码
```

运行时，开发者实例化生成的 `Plan` 子类，填入业务参数后调用 `plan.request()`：
- `before()` 钩子可注入/计算 header
- `fetch()` 由 Agent 执行实际 HTTP 请求
- `after()` / `end()` 处理响应
- `Json2http.setPlan` 全局切面统一注入鉴权等横切逻辑

---

## 本文档定位

本文记录 `packages/json2http/src/base/openapi.ts` 当前转换中的问题，分为两类。

判定 A / B 的核心标准只有一个：

> 这条信息，json2http 的**现行配置标准**（见 `schema.ts`）能不能表达？

- **A 类：转换实现的 bug**
  - json2http 现行标准**已经能表达**，但转换代码**没有正确生成**（漏了 / 丢了 / 生成错了）。
  - 修复**只改 `openapi.ts`**，不动配置标准。
  - 性质：该做没做 / 做错了，确定要修。

- **B 类：配置标准的设计取舍**
  - OpenAPI 能描述，但 json2http 现行标准**表达不了 / 不打算表达**。
  - 信息丢失是有意或可接受的——这类信息往往更灵活，更适合生成代码后由开发者在运行时处理。
  - 要"修"需**扩展 json2http 标准**本身，而不只是改转换代码。
  - 性质：不一定是 bug，先记录（warning），是否支持看收益再定。

> 说明：`Complex` 在 json2class 语义中即代表 **object**（schema 校验为 `must be an object`、不能数组、不能可选）。本文据此判定。
> `$ref` 的设计原理、引用稳定性（锚点漂移）的设计约束与解决方向，见上文「json2http 的 `$ref` 设计：复用「接口本身已存在的结构」」一节。

---

# A 类：转换实现问题

> 说明：原 **A1（`header` 参数转 `headers`）** 经评估后下沉为 **B5**。
> 结论：header 不是"静态填充位"，而是运行时横切关注点；json2http 生成代码已在运行时切面层完整覆盖 header 注入能力，静态生成收益极低。详见 B5。

## A2. `$ref` 只支持 `#/components/schemas/X`，其它 ref 目标被静默丢弃

`schema2json` 的 `$ref` 分支仅识别一种形式：

```ts
const target = this.origin.components?.schemas?.[ref.replace('#/components/schemas/', '')];
```

任何其它 `$ref` 形式都会得到 `target === undefined` → 当作"目标不存在"，该字段被静默丢弃，包括：

- **跨 components 子节**：`#/components/parameters/X`、`#/components/requestBodies/X`、`#/components/responses/X`、`#/components/headers/X` 等

### 影响

- 高频痛点是 **`components/parameters` / `requestBodies` / `responses`** —— 这三个真实工程里大量出现（公共分页参数、公共错误响应等），命中即对应接口的 `params` / `body` / `res` 字段缺失。
- 其余形式（嵌套位置、外部 / 远程）真实出现极少。

### 归属判定

按 A / B 标准（json2http 现行配置能否表达）：

- `components/parameters` / `requestBodies` / `responses` 解析后等价于内联的同名节，**`params` / `body` / `res` 标准均能表达** → 属 **A 类**，应修。
- 嵌套位置 / 外部 / 远程 ref：可视为输入预处理范畴，建议依赖 `swagger-parser` / `redocly bundle` 之类工具先做 deref，base/openapi.ts 不必承担。

### 处理建议

- **短期**：在转换层记录 warning（"$ref `<...>` 不在 `#/components/schemas/` 下，已忽略"），并在文档与 README 中明确"建议上游 deref"。
- **长期**：在 `schema2json` 的 `$ref` 分支统一处理 `#/components/<kind>/X`（`parameters` / `requestBodies` / `responses`），按 kind 还原为对应节后再走现有提取逻辑。

---

# 已知 TODO（暂不归入 A/B）

## T1. 多 method 时 plan key 不稳定

`parse()` 在一个 path 含多个合法 method 时，key 变为 `/path/METHOD`（如 `/test/POST`）；只有单个合法 method 时 key 为 `/path`。同一接口在"是否多 method"下 key 形态不同，存在重复 / 稳定性风险。源码已自带：

```ts
// todo: multi 情况下有重复风险
```

此项作为已知 TODO 记录，暂不归入 A/B，待 key 生成策略整体确定后处理。

## T2. operation 缺 summary 时未回退 path-level summary 作 title

`parse()` 的 `title` 只取 operation 自身的 `summary`：

```ts
title: item.summary || '',
```

OpenAPI 的 path-level `summary` 定义为"应用于该 path 下所有 operation"。当 operation 自身无 `summary` 时，理论上可回退到 path-level `summary` 作为 `title`（标准的 `title: string` 能表达）。当前未做此回退，title 直接为 `''`。

title 仅用于展示、重要性较低，暂作为已知 TODO 记录。

---

# B 类：配置标准的设计取舍

B 类不是必须修复的转换 bug。建议先记录 warning，是否扩展标准视收益而定。

## B1. path 参数 schema 不显式转换为 `seg`

`seg` 当前只表达字符串占位符（`map<string, string>`），且 json2http 核心可从路径中的 `{id}` 自动提取。因此只要转换结果保留真实 path（如 `/users/{id}`），即足够生成字符串型 `seg`。

OpenAPI 的 path 参数可带类型、格式、校验、描述，但这些 `seg` 表达不了。

### 处理

- 当前不需要显式生成 `seg`。
- 确保转换后保留真实 `path` 且含 `{id}`。
- 如需类型 / 校验 / 描述，未来需扩展标准。

---

## B2. `allOf` / `oneOf` / `anyOf` 无法完整表达

`schema2json` 对组合 schema 直接忽略（返回 undefined）：

```ts
if (schema.allOf || schema.oneOf || schema.anyOf) {
  // 忽略 allOf、oneOf、anyOf 等复杂结构，直接返回 undefined
}
```

json2http 配置是"生成请求/响应代码的示例结构"，不是完整 JSON Schema 类型系统。`oneOf`/`anyOf` 的运行时判别更适合业务代码处理。

### 处理

- `allOf` 纯对象合并场景可作为未来 A 类增强。
- `oneOf` / `anyOf` 保守忽略并记录 warning。
- 如需生成，可取第一个可转换分支，但属有损转换。

---

## B3. 非对象响应无法放入 `res`

`res` 标准类型为 `Complex`（即 object，schema 校验为 `res must be an object`、不能数组）。因此数组、字符串、二进制等顶层响应无法作为 `res` 表达。`res()` 末尾以 `Object.prototype.toString` 判断非对象即丢弃，与标准一致。

### 样例

```json
{
  "responses": {
    "200": {
      "content": {
        "application/json": {
          "schema": { "type": "array", "items": { "$ref": "#/components/schemas/User" } }
        }
      }
    }
  }
}
```

### 处理

- 当前可继续丢弃这类 `res`。
- 可记录 warning："响应非对象，未生成 res"。
- 如需支持需扩展标准。

---

## B4. query 参数只支持基础标量

`params` 标准类型为 `map<string, string | number | boolean>`。OpenAPI query 参数可为 array / object，并带 `style`、`explode` 序列化规则，这些无法表达。

### 样例

```json
{
  "parameters": [
    { "in": "query", "name": "tags", "schema": { "type": "array", "items": { "type": "string" } }, "style": "form", "explode": true }
  ]
}
```

### 处理

- 继续只保留 string / number / integer / boolean。
- 对 array / object query 记录 warning。

---

## B5. `header` 参数：交由运行时切面注入，不静态生成 `headers`

> 本节是原 A1 评估后的最终归宿。

### 标准能表达，但不代表该静态生成

json2http 标准支持 `headers` 字段（类型 `map<string, string | (string | null)[]>`），所以 `header` 参数**理论上**能转换生成。但当前 `params()` 只处理 `in: 'query'`，`in: 'header'` 被 `if (param.in !== 'query') continue;` 跳过——这是**有意的设计取舍**，不是 bug。

### 为什么不做：header 是运行时横切关注点，不是"业务填充位"

`body` / `params` 是"这一次请求的业务载荷"，每个接口形状不同、值由调用方当场提供，适合生成示例骨架当填充位。
`header` 在真实工程里几乎都是**跨接口统一、值在运行时确定**的横切信息，不是业务填充位：

| header 类别 | 例子 | 谁来给值 |
| --- | --- | --- |
| 鉴权 / 身份 | `Authorization`、`X-pateo-session`、`Opt-AccountName`、`X-Api-Key` | 运行时由拦截器 / 全局切面注入 |
| 内容协商 | `Content-Type`、`Accept` | 由 body media type / 框架决定 |
| 链路 / 观测 | `X-Request-Id`、`traceparent` | 运行时自动生成 |
| 公共上下文 | `Accept-Language`、`X-Tenant-Id` | 全局配置一次 |
| 业务型（少数） | `Idempotency-Key`、`If-Match`（ETag）、`Range` | 运行时计算（uuid、上一次响应、偏移），仍非静态常量 |

即便少数"业务型 header"确实由调用方提供，其值也几乎都是运行时算出来的标量，给个空字符串占位（`{name:''}`）意义很小；而真实 API 里 header 绝大多数是鉴权 / 横切类，若按"每个 plan 静态生成一份 `headers`"会得到大量**重复、空值、需运行时覆盖**的噪音。

### 生成代码已在运行时切面层完整覆盖 header 注入

查 json2http 生成器（`packages/json2http/src/arkTs/code.ts`）与各 agent，运行时注入能力齐全，无需靠转换静态生成：

- **`Plan.headers` 可变**：`abstract headers: Record<string, Any>`，运行时可随时读写。
- **生命周期钩子（单接口切面）**：`Plan` 暴露 `before` / `process` / `after` 等钩子；`request()` 按 `before → fetch → after` 执行，`before` 即"发请求前注入 / 计算 header"的标准位置。
- **`Json2http.setPlan`（全局切面）**：`static setPlan: ((plan: Plan) => void) | null`，可对所有接口统一注入鉴权 / 公共 header。
- **agent 自动注入**：`axios` / `fetch` / `rcp` 等 agent 在 `fetch()` 内按 body 类型自动写入 `Content-Type`（`plan.headers['content-type'] = plan.body.contentType`）——连内容协商 header 都由 agent 运行时处理，而非配置静态生成。

### 处理

- **转换层不生成 `headers`**：`header` 参数继续跳过；如需可记录 warning（"header 参数未生成，运行时注入"）。
- **鉴权 / 签名 / 公共 header**：用 `Json2http.setPlan` 全局切面或 agent 注入。
- **业务型 header（幂等键、ETag、Range 等）**：在对应 plan 的 `before` 钩子里运行时计算后写入 `plan.headers`。
- 若未来确有"静态业务 header 入口"的明确需求，需扩展标准（例如标注某 header 为运行时注入位），属 B 类增强，收益视实际场景再定。


---

## B6. media type 与 encoding 信息有损

body 抽象为 `json | byte | plain | map | form` 五类。OpenAPI 可描述更细的 media type、`encoding`、字段级 `contentType` 等，这些会丢失。

### 样例

```json
{
  "requestBody": {
    "content": {
      "multipart/form-data": {
        "encoding": { "metadata": { "contentType": "application/json" } },
        "schema": {
          "type": "object",
          "properties": {
            "metadata": { "type": "object" },
            "file": { "type": "string", "format": "binary" }
          }
        }
      }
    }
  }
}
```

### 处理

- 保留基础 `form` 结构，复杂 encoding 交运行时处理。

---

## B7. `cookie` 参数暂未表达

OpenAPI 支持 `in: cookie`，但 json2http 标准没有 `cookies` 字段。

### 样例

```json
{
  "parameters": [
    { "in": "cookie", "name": "sessionId", "schema": { "type": "string" } }
  ]
}
```

### 处理

- Cookie 通常由底层 HTTP 客户端 / cookie jar / 运行时拦截器管理，暂不通过配置静态生成。

---

## B8. `requestBody.required` 与 `data?` 语义不完全等价

OpenAPI 的 `requestBody.required` 表示整个请求体是否必传；json2http 的 `data?` 偏向"生成代码里 data 是否可空/可选"。两者接近但不等价。

> 需注意：当前 `body()` **根本没有读取 `requestBody.required`**，`data?` 仅由顶层 schema 的 nullable 决定（且 `map` / `form` 不支持 `data?`，仅 `json` / `byte` / `plain` 支持）。所以这里不是"转换错了"，而是"该信息当前未被利用 + 标准表达力不同"。

### 样例

```json
{
  "requestBody": {
    "required": false,
    "content": {
      "application/json": { "schema": { "type": "object", "properties": { "name": { "type": "string" } } } }
    }
  }
}
```

### 处理

- 当前继续只按 schema nullable 生成 `data?`，忽略 `requestBody.required`。
- 如需精确表达"请求体可省略"，需扩展标准（例如单独的 body required 元信息）。

---

# 建议修复优先级

## A 类优先修复

- **A2**：`$ref` 只支持 `#/components/schemas/X`，其它 ref 目标静默丢弃。高频痛点是 `components/parameters` / `requestBodies` / `responses`，建议短期补 warning、长期统一处理。

## 已知 TODO

- **T1**：多 method plan key 稳定性，待整体策略确定。
- **T2**：operation 缺 summary 时回退 path-level summary 作 title（重要性低）。

## B 类暂不强修

先记录 warning，是否扩展标准视生成代码的实际收益与复杂度再定。其中 **B5（header）** 已明确：运行时切面已覆盖，转换层不生成。
