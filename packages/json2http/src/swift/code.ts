import { Json2classSwift } from 'json2class';
import * as Base from '../base';

export class Complex extends Json2classSwift.Complex {}

export class Simple extends Json2classSwift.Simple {}

export class Http extends Base.Http<Complex, Simple> {
  toLaunch(plan: Base.SchemaPlan) {
    const { addX } = Base.func;

    const { body } = plan;

    let bodyDef = `Body${addX('Never?')}("", nil)`;
    if (body) {
      if (body.type === 'form') {
        bodyDef = `Body("${body.type}", BodyForm(${body.data.fields.def}, ${body.data.files.def}))`;
      } else if (body.data?.array.length) {
        bodyDef = `Body${addX(
          `${plan.title.lang.arrayType(body.data.array, body.data.decl)}${body.data.optional ? '?' : ''}`,
        )}("${body.type}", [])`;
      } else if (body.type === 'plain') {
        bodyDef = `Body${addX(`String${body.data?.optional ? '?' : ''}`)}("${body.type}", "")`;
      } else if (body.type === 'byte') {
        bodyDef = `Body${addX(`Data${body.data?.optional ? '?' : ''}`)}("${body.type}", Data())`;
      } else if (body.data) {
        bodyDef = `Body${addX(`${body.data.decl}${body.data.optional ? '?' : ''}`)}("${body.type}", ${body.data.def})`;
      } else {
        Base.func.unreachableError(`[${plan.path.origin}] unknown body type parsing`);
      }
    }

    const types = [
      `var path = "${plan.path.origin}"`,
      `var seg = ${plan.seg?.def ?? '_Json2class()'}`,
      `var title = "${plan.title.origin}"`,
      `var method = "${plan.method.origin}"`,
      `var res = ${plan.res?.def ?? '_Json2class()'}`,
      `var params = ${plan.params?.def ?? '_Json2class()'}`,
      `var body = ${bodyDef}`,
      `var headers = _parse("${Base.func.convertWrap(JSON.stringify(plan.headers?.origin ?? {}))}")`,
      `var baseURL = ""`,
      `var agent: any Agent = ${Http.agentConfig.name}()`,
      `var reply = Reply()`,
      `var start: (() async throws -> Void)? = nil`,
      `var before: (() async throws -> Void)? = nil`,
      `var ready: (() -> Void)? = nil`,
      `var process: ((Reply) -> Void)? = nil`,
      `var after: (() async throws -> Void)? = nil`,
      `var end: (() async throws -> Void)? = nil`,
    ].join('; ');

    return {
      code: `
    func ${this.launch}(_ setPlan: @escaping (${this.declPlan}) -> Void) async throws -> ${this.declPlan} {
        var plan = ${this.declPlan}()
        Json2http.setPlan?(plan)
        setPlan(plan)
        if let start = plan.start { try await start() } else { try await plan.request() }
        return plan
    } // ${plan.path.origin}`,
      plan: `
class ${this.declPlan}: Plan { ${types}; }`,
    };
  }

  static get agentConfig() {
    const { addX } = Base.func;
    const { func, env, DefaultAgent } = Base;
    switch (env.defaultAgent) {
      case DefaultAgent.Swift_Alamofire5:
        return {
          name: 'AlamofireAgent',
          import: `import Foundation
import Alamofire`,
          code: `
class AlamofireAgent: Agent {
    private static let _session = Session(configuration: {
        let configuration = URLSessionConfiguration.default
        // configuration.timeoutIntervalForRequest = 30
        return configuration
    }())

    var session: Session?
    var option: URLRequest?
    var response: AFDataResponse${addX('Data')}?
    
    func fetch${addX('P: Plan')}(plan: P) async throws -> Reply {
        var plan = plan
        let session = self.session ?? Self._session

        var path = plan.path
        let seg = plan.seg.toJson()
        for (key, value) in seg {
            path = path.replacingOccurrences(of: "{\\(key)}", with: value as? String ?? "")
        }
        
        let q = _obj2get(plan.params.toJson())
        path = "\\(path)\\(q.isEmpty ? "" : (path.contains("?") ? "&" : "?"))\\(q)"

        var option = URLRequest(url: URL(string: "\\(plan.baseURL)\\(path)") ?? URL(fileURLWithPath: ""))
        option.httpMethod = plan.method

        if let c = plan.body.contentType { plan.headers["content-type"] = c }
        for (key, value) in plan.headers {
            if let value = value as? String {
                option.setValue(value, forHTTPHeaderField: key)
            } else if let value = value as? [Any] {
                for v in value { option.addValue("\\(v)", forHTTPHeaderField: key) }
            } else {
                option.setValue("\\(value)", forHTTPHeaderField: key)
            }
        }
        
        option.httpBody = try await self.body(plan: plan) as? Data ?? nil
        self.option = option

        plan.ready?()

        let response = await withCheckedContinuation { continuation in
            session.request(self.option ?? option).responseData { [weak self] response in
                self?.response = response
                continuation.resume(returning: response)
            }
        }

        let code = response.response?.statusCode ?? 0
        plan.reply.code = code
        plan.reply.message = _code2message["\\(code)"] ?? "unknown http code \\(code)"
        
        switch response.result {
            case .success(let data):
                plan.reply.data = try? JSONSerialization.jsonObject(with: data, options: []) ?? data
            case .failure(let error):
                plan.reply.error = error.localizedDescription
        }

        return plan.reply
    }

    func body${addX('P: Plan')}(plan: P) async throws -> Any? {
        let type = plan.body.type
        let data = plan.body.data
        switch type {
            case "plain": if let v = plan.body.data as? String { return v.data(using: .utf8) }
            case "byte": if let v = plan.body.data as? Data { return v }
            case "json":
                return nil
                /*
                if let v = data as? [Json2class?] {
                    return _stringify(v.map { $0?.toJson() })?.data(using: .utf8)
                } else if let v = data as? Json2class {
                    return _stringify(v.toJson())?.data(using: .utf8)
                } else {
                    return _stringify(data)?.data(using: .utf8)
                } if plan.method != "GET" && request.httpBody == nil {
                    request.httpBody = "".data(using: .utf8)
                }*/
            default: return nil
        }
        return nil
    }
}`,
        };
      default:
        func.unreachableError('defaultAgent', [env.defaultAgent]);
        return { name: '', import: '', code: '' };
    }
  }

  static toEntry() {
    const { addX } = Base.func;
    const { agentConfig } = this;
    return `${agentConfig.import}

@json2class@

private func _nullFilter(_ data: [String: Any?]) -> [String: Any?] {
    var result: [String: Any?] = [:]
    for (key, value) in data {
        if let dictValue = value as? [String: Any?] {
            let nested = _nullFilter(dictValue)
            if !nested.isEmpty {
                result[key] = nested
            }
        } else if let actualValue = value {
            result[key] = actualValue
        }
    }
    return result
}

private func _obj2get(_ obj: [String: Any?]) -> String {
    let rfc: [UInt16] = [0x0000, 0x0000, 0x6782, 0x03ff, 0xfffe, 0x87ff, 0xfffe, 0x47ff]
    func encode(_ string: String) -> String {
        var result = ""
        for char in string.unicodeScalars {
            let code = Int(char.value)
            if code < 128 {
                let i1 = code >> 4
                let i2 = code & 0x0f
                if i1 < rfc.count && (rfc[i1] & (1 << i2)) != 0 {
                    result.append(Character(char))
                } else {
                    result.append(String(format: "%%%02X", code))
                }
            } else {
                let utf8 = String(char).utf8
                for byte in utf8 { result.append(String(format: "%%%02X", byte)) }
            }
        }
        return result
    }
    return obj.compactMapValues { $0 } .map { "\\(encode($0))=\\(encode("\\($1)"))" }.joined(separator: "&")
}

private func _replyReset(_ reply: Reply) {
    reply.code = nil
    reply.error = nil
    reply.data = nil
    reply.exception = nil
    reply.message = ""
}

class _Json2class: Json2class {
    required init() { super.init(); self.preset = "{}"; }
    @discardableResult
    override func fromJson(_ data: Any?, setRule: ((Rule) -> Void)? = nil, rule: Rule? = nil) -> Self { return self }
    override func toJson() -> [String: Any?] { return [:] }
}

class Reply {
    var code: Int?
    var message: String = ""
    var error: String?
    var data: Any?
    var exception: Error?
}

protocol Agent {
    func fetch${addX('P: Plan')}(plan: P) async throws -> Reply
    func body${addX('P: Plan')}(plan: P) async throws -> Any?
}

${agentConfig.code}

class BodyFormFile {
    let content: Data?
    let file: String?
    var filename: String?
    var contentType: String?
    var headers: [String: [String]]?
    
    private init(content: Data?, file: String?) {
        self.content = content
        self.file = file
        self.contentType = "application/octet-stream"
    }
    
    static func fromFile(_ file: String) -> BodyFormFile {
        return BodyFormFile(content: nil, file: file)
    }
    
    static func fromString(_ value: String) -> BodyFormFile {
        return BodyFormFile(content: value.data(using: .utf8), file: nil)
    }
    
    static func fromBytes(_ value: Data) -> BodyFormFile {
        return BodyFormFile(content: value, file: nil)
    }
}

class BodyForm${addX('T: Json2class, K: Json2class')} {
    let fields: T
    let files: K

    init(_ fields: T, _ files: K) {
        self.fields = fields
        self.files = files
    }
}

private let _body2type: [String: String] = [${Base.bodyTypes
      .map(k => `"${k}": "${(Base.contentTypes as Record<string, string>)[k]}"`)
      .join(', ')}]
class Body${addX('T')} {
    let type: String
    var data: T

    var contentType: String?
    
    init(_ type: String, _ data: T) {
        self.type = type
        self.data = data
        self.contentType = _body2type[type] ?? nil
    }
}

class Json2httpError: Error {
    let plan: any Plan
    var localizedDescription: String {
        return plan.reply.error?.isEmpty == false ? plan.reply.error! : plan.reply.message
    }
    let name: String
    
    init${addX('P: Plan')}(_ plan: P) {
        self.plan = plan
        self.name = plan.title
    }
}

protocol Plan {
    associatedtype S: Json2class
    associatedtype R: Json2class
    associatedtype P: Json2class
    associatedtype B

    var baseURL: String { get set }
    
    var path: String { get set }
    var seg: S { get set }
    
    var title: String { get }
    var method: String { get set }
    var res: R { get set }
    
    var params: P { get set }
    var body: Body${addX('B')} { get set }
    
    var headers: [String: Any] { get set }
    
    var agent: any Agent { get set }
    
    var reply: Reply { get set }
        
    var start: (() async throws -> Void)? { get set }
    var before: (() async throws -> Void)? { get set }
    var ready: (() -> Void)? { get set }
    var process: ((Reply) -> Void)? { get set }
    var after: (() async throws -> Void)? { get set }
    var end: (() async throws -> Void)? { get set }
}

extension Plan {
    func abort() throws -> Void {
        if self.reply.code != 200 && !self.reply.message.isEmpty {
            throw Json2httpError(self)
        }
        if let error = self.reply.error, !error.isEmpty {
            throw Json2httpError(self)
        }
    }
    
    mutating func fetch() async throws -> Void {
        _replyReset(self.reply)
        do {
            self.reply = try await self.agent.fetch(plan: self)
        } catch {
            if let error = error as? Error {
                self.reply.exception = error
                self.reply.error = "\\(error)"
                // 返回 reply，不抛出
            } else {
                throw error
            }
        }
        await self.process?(self.reply)
    }
  
    mutating func request() async throws -> Void {
        try await self.before?()
        try await self.fetch()
        try await self.after?()
        self.res.fromAny(self.reply.data) // todo: self.res 不能随便调用
        try await (self.end ?? self.abort)?()
    }
}

@aliases@
@deps@

class Json2http {
    static let single = Json2http()
    static var setPlan: ((any Plan) -> Void)?
    
    private init() {}
    
@request@
}

private let _code2message: [String: String] = (_parse("${Base.func.convertWrap(
      JSON.stringify(Base.code2message),
    )}") as? [String: String]) ?? [:]
`;
  }
}
