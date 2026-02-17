import { Json2classKotlin } from 'json2class';
import * as Base from '../base';

export class Complex extends Json2classKotlin.Complex {}

export class Simple extends Json2classKotlin.Simple {}

export class Http extends Base.Http<Complex, Simple> {
  toLaunch(plan: Base.SchemaPlan) {
    const { addX } = Base.func;

    const { body } = plan;

    let bodyDef = 'null';
    if (body) {
      if (body.type === 'form') {
        bodyDef = `Body("${body.type}", BodyForm(${body.data.fields.def}, ${body.data.files.def}))`;
      } else if (body.data?.array.length) {
        bodyDef = `Body${addX(
          `${plan.title.lang.arrayType(body.data.array, body.data.decl)}${body.data.optional ? '?' : ''}`,
        )}("${body.type}", mutableListOf())`;
      } else if (body.type === 'plain') {
        bodyDef = `Body${addX(`String${body.data?.optional ? '?' : ''}`)}("${body.type}", "")`;
      } else if (body.type === 'byte') {
        bodyDef = `Body${addX(`ByteArray${body.data?.optional ? '?' : ''}`)}("${body.type}", ByteArray(0))`;
      } else if (body.data) {
        bodyDef = `Body${addX(`${body.data.decl}${body.data.optional ? '?' : ''}`)}("${body.type}", ${body.data.def})`;
      } else {
        Base.func.unreachableError(`[${plan.path.origin}] unknown body type parsing`);
      }
    }

    const types = [
      `override var path = "${plan.path.origin}"`,
      `override var seg = ${plan.seg?.def ?? 'null'}`,
      `override val title = "${plan.title.origin}"`,
      `override var method = "${plan.method.origin}"`,
      `override var res = ${plan.res?.def ?? 'null'}`,
      `override var params = ${plan.params?.def ?? 'null'}`,
      `override var body = ${bodyDef}`,
      `override var headers = _parseMap("${Base.func.convertWrap(JSON.stringify(plan.headers?.origin ?? {}))}")`,
    ].join(';');

    return {
      code: `
suspend fun ${this.launch}(setPlan: (plan: ${this.declPlan}) -> Unit): ${this.declPlan} {
  val plan = ${this.declPlan}()
  Json2http.setPlan?.invoke(plan)
  setPlan(plan)
  (plan.start ?: plan::request).invoke()
  return plan
} // ${plan.path.origin}`,
      plan: `
class ${this.declPlan}: Plan() { ${types}; }`,
    };
  }

  static get agentConfig() {
    const { func, env, DefaultAgent } = Base;
    switch (env.defaultAgent) {
      case DefaultAgent.Kotlin_OkHttp4:
        return {
          name: 'OkHttpAgent',
          import: `import okhttp3.*
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.ResponseBody.Companion.toResponseBody
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import java.io.File`,
          code: `
class OkHttpAgent: Agent() {
  companion object {
    private val session = OkHttpClient.Builder().build()
  }

  var session: OkHttpClient? = null
  var option: Request.Builder? = null
  var response: Response? = null

  override suspend fun fetch(plan: Plan): Reply {
    val session = this.session ?: OkHttpAgent.session
    
    var path = plan.path
    plan.seg?.let { seg ->
      val _seg = seg.toJson()
      val regex = Regex("\\\\{(.*?)\\\\}")
      path = regex.replace(path) { matchResult ->
        val key = matchResult.groupValues[1]
        _seg[key]?.toString() ?: ""
      }
    }
    path = "\${plan.baseURL}\${path}";
    val q = _obj2get(plan.params?.toJson() ?: mapOf());
    path = "\${path}\${if (q.isNotEmpty()) (if (path.contains('?')) "&" else "?") else ""}\${q}"

    val option = Request.Builder()
    plan.body?.let { body -> plan.headers["content-type"] = body.contentType }
    plan.headers.forEach { (key, value) ->
      when (value) {
        is String -> option.addHeader(key, value)
        is List<*> -> value.forEach { item -> option.addHeader(key, item.toString()) }
        else -> option.addHeader(key, value.toString())
      }
    }
    
    option.url(path).method(plan.method, body(plan))
    this.option = option

    plan.ready?.invoke()

    val response = session.newCall(option.build()).execute()
    val bytes = response.body?.bytes()
    this.response = response.newBuilder().body(bytes?.toResponseBody(response.body?.contentType())).build()

    plan.reply.code = response.code
    plan.reply.message = _code2message["\${plan.reply.code ?: 0}"] ?: "unknown http code \${plan.reply.code}"

    try {
      plan.reply.data = bytes
      plan.reply.data = _parse(String(plan.reply.data as ByteArray))
    } catch (_: Exception) {}

    return plan.reply;
  }

  override suspend fun body(plan: Plan): RequestBody? {
    val type = plan.body?.type
    val data = plan.body?.data
    var body: RequestBody? = when (type) {
      null -> null
      "json" -> _stringify(
        if (data is List<*>) data.map { if (it is Json2class) _nullFilter(it.toJson()) else it }
          else if (data is Json2class) _nullFilter(data.toJson()) else data
        ).toRequestBody()
      "map" -> if (data is Json2class) _obj2get(data.toJson()).toRequestBody() else null
      "form" -> { 
        if (data !is BodyForm<*, *>) {
          return null
        }
        val map: MultipartBody.Builder = MultipartBody.Builder()
        fun a2b(a: BodyFormFile, key: String) {
          val headersBuilder = Headers.Builder()
          a.headers?.forEach { (k, v) -> v.forEach { vv -> headersBuilder.add(k, vv) } }
          if (a.file != null) {
            val file = File(a.file)
            val filename = a.filename ?: file.name
            val disposition = "form-data; name=\\"$key\\"; filename=\\"$filename\\""
            headersBuilder.addUnsafeNonAscii("content-disposition", disposition)
            map.addPart(headersBuilder.build(), file.asRequestBody(a.contentType?.toMediaTypeOrNull()))
          } else if (a.content != null) {
            val filename = a.filename ?: ""
            val disposition = "form-data; name=\\"$key\\"; filename=\\"$filename\\""
            headersBuilder.addUnsafeNonAscii("content-disposition", disposition)
            map.addPart(headersBuilder.build(), a.content.toRequestBody(a.contentType?.toMediaTypeOrNull()))
          }
        }
        fun cb(key: String, value: Any?) {
          (if (value is List<*>) value else listOf(value)).forEach { e ->
            if (e is BodyFormFile) {
              a2b(e, key)
            } else if (e != null) {
              map.addFormDataPart(key, e.toString())
            }
          }
        }
        data.fields.toJson().forEach(::cb)
        data.files.toJson().forEach(::cb)
        return map.build()
      }
      else -> when (data) {
        is String -> data.toRequestBody()
        is ByteArray -> data.toRequestBody()
        else -> null
      }
    }
    if (plan.method != "GET" && body == null) {
      body = "".toRequestBody()
    }
    return body
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

private fun _obj2get(obj: Map${addX('String, Any?')}): String {
  return obj.filterValues { it != null }
    .map { (k, v) -> "\${java.net.URLEncoder.encode(k, "UTF-8")}=\${java.net.URLEncoder.encode(v.toString(), "UTF-8")}" }
      .joinToString("&")
}

private fun _nullFilter(data: Map${addX('String, Any?')}): Map${addX('String, Any?')} {
  val result = mutableMapOf${addX('String, Any?')}()
  for ((key, value) in data) {
    if (value is Map<*, *> && value !is List<*>) {
      val nested = _nullFilter(value as Map<String, Any?>)
      if (nested.isNotEmpty()) {
        result[key] = nested
      }
    } else if (value != null) {
      result[key] = value
    }
  }
  return result
}

private fun _replyReset(reply: Reply) {
  reply.code = null
  reply.error = null
  reply.data = null
  reply.exception = null
  reply.message = ""
}

class Reply {
  var code: Int? = null
  var message: String = ""
  var error: String? = null
  var data: Any? = null
  var exception: Throwable? = null
}

abstract class Agent {
  abstract suspend fun fetch(plan: Plan): Reply
  abstract suspend fun body(plan: Plan): Any?
}${agentConfig.code}

class BodyFormFile private constructor(
  val content: ByteArray? = null,
  val file: String? = null
) {
  var filename: String? = null
  var contentType: String? = "application/octet-stream"
  var headers: MutableMap<String, List<String>>? = null
  companion object {
    fun fromFile(file: String): BodyFormFile { return BodyFormFile(null, file) }
    fun fromString(value: String): BodyFormFile { return BodyFormFile(value.toByteArray(), null) }
    fun fromBytes(value: ByteArray): BodyFormFile { return BodyFormFile(value, null) }
  }
}

class BodyForm<T: Json2class, K: Json2class>(
  var fields: T,
  var files: K
)

class Body<T>(val type: String, var data: T) {
  companion object {
    private val _types = mapOf(${Base.bodyTypes
      .map(k => `"${k}" to "${(Base.contentTypes as Record<string, string>)[k]}"`)
      .join(',')})
  }
  val contentType: String? = _types[type]
}

class Json2httpError(val plan: Plan) : Exception() {
  override val message: String = toString()
  override fun toString(): String {
    return plan.reply.error.takeIf { !it.isNullOrEmpty() } ?: plan.reply.message
  }
}

abstract class Plan {
  var baseURL: String = ""

  abstract var path: String
  abstract val seg: Json2class?

  abstract val title: String
  abstract var method: String
  abstract val res: Json2class?

  abstract val params: Json2class?
  abstract val body: Body<*>?

  abstract var headers: MutableMap<String, Any?>

  var agent: Agent = ${agentConfig.name}()

  var reply = Reply()

  suspend fun abort() {
    if (reply.code != 200 && reply.message.isNotEmpty()) {
      throw Json2httpError(this)
    }
    if (reply.error != null) {
      throw Json2httpError(this)
    }
  }

  suspend fun fetch() {
    _replyReset(reply)
    try {
      reply = agent.fetch(this)
    } catch (e: Throwable) {
      reply.exception = e
      reply.error = (e.message ?: e.toString())
    } finally {
      process?.invoke(reply)
    }
  }

  suspend fun request() {
    before?.invoke()
    fetch()
    after?.invoke()
    res?.fromAny(reply.data)
    (end ?: ::abort).invoke()
  }

  var start: (suspend () -> Unit)? = null
  var before: (suspend () -> Unit)? = null
  var ready: (suspend () -> Unit)? = null
  var process: (suspend (Reply) -> Unit)? = null
  var after: (suspend () -> Unit)? = null
  var end: (suspend () -> Unit)? = null
}
@aliases@
@deps@

class Json2http private constructor() {
  companion object {
    val single: Json2http by lazy { Json2http() }
    var setPlan: ((Plan) -> Unit)? = null
  }
@request@
}

private val _code2message = _parseMap("${Base.func.convertWrap(JSON.stringify(Base.code2message))}") as Map${addX(
      'String, String',
    )}
`;
  }
}
