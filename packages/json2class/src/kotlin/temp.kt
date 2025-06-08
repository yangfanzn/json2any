package com.yangfanzn.json2class

import org.json.JSONObject as _JSONObject
import org.json.JSONArray as _JSONArray

private fun _JSONObject._toMap(): MutableMap<String, Any?> {
    val map = mutableMapOf<String, Any?>()
    val keys = keys()
    while (keys.hasNext()) {
        val key = keys.next()
        var value = get(key)
        value = when (value) {
            is _JSONObject -> value._toMap()
            is _JSONArray -> value._toList()
            else -> value
        }
        map[key] = value
    }
    return map
}
private fun _JSONArray._toList(): List<Any?> {
    val list = mutableListOf<Any?>()
    for (i in 0 until length()) {
        var elem = get(i)
        elem = when (elem) {
            is _JSONObject -> elem._toMap()
            is _JSONArray -> elem._toList()
            else -> elem
        }
        list.add(elem)
    }
    return list
}
private fun _stringify(data: Any?): String {
    return when (data) {
        is Map<*, *> -> _JSONObject(data).toString()
        is List<*> -> _JSONArray(data).toString()
        is String -> "\"${data}\""
        else -> data.toString()
    }
}

enum class DiffType { Keep, Default, Null }

enum class MissKey { Keep, Default, Null }

enum class MoreIndex { Fill, Drop, Null }

enum class MissIndex { Fill, Drop, Null, Skip }

class Rule {
    var missKey = MissKey.Null
    var diffType = DiffType.Null
    var moreIndex = MoreIndex.Fill
    var missIndex = MissIndex.Skip

    fun copy(): Rule {
        val rule = Rule()
        rule.missKey = missKey
        rule.diffType = diffType
        rule.moreIndex = moreIndex
        rule.missIndex = missIndex
        return rule
    }
}

class Json2classError(override val message: String) : Exception() {
    override fun toString(): String {
        return listOf(
            "Json2classError: $message",
            "the occurrence of this error indicates an unexpected situation in the program,",
            "please report this error to the @author@. Thank you very much!"
        ).joinToString("\n")
    }
}

abstract class Json2class {
    companion object {
        var defaultRule: Rule = Rule()
    }

    var rule: Rule? = null

    fun fromAny(
        data: Any?,
        setRule: ((Rule) -> Unit)? = null,
        rule: Rule? = null
    ): Json2class {
        var _data = data
        if (data is String) {
            try {
                _data = _JSONObject(data)._toMap()
            } catch (_: Exception) {
            }
        }
        return fromJson(_data, setRule, rule)
    }

    abstract fun fromJson(
        data: Any?,
        setRule: ((Rule) -> Unit)? = null,
        rule: Rule? = null
    ): Json2class

    open var preset = ""

    fun fromPreset(
        setRule: ((Rule) -> Unit)? = null,
        rule: Rule? = null
    ): Json2class {
        return fromAny(preset, setRule, rule)
    }

    abstract fun toNew(): Json2class

    abstract fun toJson(): MutableMap<String, Any?>

    private fun _isSameSimple(source: Any?, target: Any?): Boolean {
        return source?.javaClass == target?.javaClass ||
                (source is Number && target is Number)
    }

    private fun <T> _nList(array: List<Boolean>, n: Int): MutableList<Any?> {
        return mutableListOf()
    }

    private fun <T> _nArray(
        data: List<Any?>,
        key: String,
        array: List<Boolean>,
        optional: Boolean,
        cur: MutableList<Any?>,
        def: Any?,
        level: Int,
        rule: Rule
    ): MutableList<Any?> {
        val t = _nList<T>(array, array.size - level + 1)
        for (i in data.indices) {
            val isExist = cur.size > i
            val _data = data.getOrNull(i)
            val _cur = cur.getOrNull(i)
            if (array.size == level) {
                if (def is Json2class) {
                    if (!isExist) {
                        if (rule.moreIndex == MoreIndex.Null && array[level - 1]) {
                            t.add(null)
                        } else {
                            if (rule.moreIndex == MoreIndex.Drop) {
                            } else {
                                if (_data is Map<*, *>) {
                                    if (_cur != null && _cur !is Json2class) {
                                        throw Json2classError(
                                            "the current value of a non-empty array should match the type of the provided default value"
                                        )
                                    }
                                    t.add(
                                        ((_cur as? Json2class) ?: def.toNew()).fromJson(
                                            _data,
                                            rule = rule
                                        )
                                    )
                                } else if (array[level - 1]) {
                                    t.add(null)
                                } else {
                                    t.add(def.toNew())
                                }
                            }
                        }
                    } else if (_data is Map<*, *>) {
                        if (_cur != null && _cur !is Json2class) {
                            throw Json2classError(
                                "the current value of a non-empty array should match the type of the provided default value"
                            )
                        }
                        t.add(((_cur as? Json2class) ?: def.toNew()).fromJson(_data, rule = rule))
                    } else if (array[level - 1] && _data == null) {
                        t.add(null)
                    } else {
                        if (rule.diffType == DiffType.Null && array[level - 1]) {
                            t.add(null)
                        } else {
                            t.add(if (rule.diffType == DiffType.Keep) _cur else def.toNew())
                        }
                    }
                } else {
                    if (!isExist) {
                        if (rule.moreIndex == MoreIndex.Null && array[level - 1]) {
                            t.add(null)
                        } else {
                            if (rule.moreIndex == MoreIndex.Drop) {
                            } else {
                                if (_isSameSimple(_data, def)) {
                                    t.add(_data)
                                } else if (array[level - 1]) {
                                    t.add(null)
                                } else {
                                    t.add(def)
                                }
                            }
                        }
                    } else if (_isSameSimple(_data, def)) {
                        t.add(_data)
                    } else if (array[level - 1] && _data == null) {
                        t.add(null)
                    } else {
                        if (rule.diffType == DiffType.Null && array[level - 1]) {
                            t.add(null)
                        } else {
                            t.add(if (rule.diffType == DiffType.Keep) _cur else def)
                        }
                    }
                }
            } else {
                if (!isExist) {
                    if (rule.moreIndex == MoreIndex.Null && array[level - 1]) {
                        t.add(null)
                    } else {
                        if (rule.moreIndex == MoreIndex.Drop) {
                        } else if (_data is List<Any?>) {
                            t.add(
                                _nArray<T>(
                                    _data,
                                    key,
                                    array,
                                    optional,
                                    _nList<T>(array, array.size - level),
                                    def,
                                    level + 1,
                                    rule
                                )
                            )
                        } else {
                            t.add(
                                if (array[level - 1]) null else _nList<T>(
                                    array,
                                    array.size - level
                                )
                            )
                        }
                    }
                } else if (_data is List<Any?>) {
                    t.add(
                        _nArray<T>(
                            _data,
                            key,
                            array,
                            optional,
                            _cur as? MutableList<Any?> ?: _nList<T>(array, array.size - level),
                            def,
                            level + 1,
                            rule
                        )
                    )
                } else if (array[level - 1] && _data == null) {
                    t.add(null)
                } else {
                    if (rule.diffType == DiffType.Null && array[level - 1]) {
                        t.add(null)
                    } else if (rule.diffType == DiffType.Keep) {
                        t.add(_cur)
                    } else {
                        if (cur.size > data.size &&
                            _cur != null &&
                            (rule.missIndex == MissIndex.Fill ||
                                    (rule.missIndex == MissIndex.Null && !array[level - 1]))
                        ) {
                            t.add(
                                _nArray<T>(
                                    _nList<T>(array, array.size - level),
                                    key,
                                    array,
                                    optional,
                                    _cur as MutableList<Any?>,
                                    def,
                                    level + 1,
                                    rule
                                )
                            )
                        } else {
                            t.add(_nList<T>(array, array.size - level))
                        }
                    }
                }
            }
        }
        if (rule.missIndex != MissIndex.Drop) {
            for (i in 0 until (cur.size - data.size)) {
                if (array.size == level) {
                    if (rule.missIndex == MissIndex.Null && array[level - 1]) {
                        t.add(null)
                    } else if (rule.missIndex == MissIndex.Skip) {
                        t.add(cur[data.size + i])
                    } else {
                        if (def is Json2class) {
                            t.add(def.toNew())
                        } else {
                            t.add(def)
                        }
                    }
                } else {
                    if (rule.missIndex == MissIndex.Null && array[level - 1]) {
                        t.add(null)
                    } else if (rule.missIndex == MissIndex.Skip) {
                        t.add(cur[data.size + i])
                    } else {
                        if (cur[data.size + i] == null) {
                            t.add(null)
                        } else {
                            t.add(
                                _nArray<T>(
                                    _nList<T>(array, array.size - level),
                                    key,
                                    array,
                                    optional,
                                    cur[data.size + i] as MutableList<Any?>,
                                    def,
                                    level + 1,
                                    rule
                                )
                            )
                        }
                    }
                }
            }
        }
        return t
    }

    protected fun <T> _fromJson(
        data: Any?,
        key: String,
        array: List<Boolean>,
        optional: Boolean,
        cur: Any?,
        def: Any?,
        rule: Rule
    ): Any? {
        var isExist = true
        var _data = data
        if (data !is Map<*, *>) {
            _data = mapOf<String, Any?>()
        }
        isExist = (_data as Map<*, *>).containsKey(key)
        _data = (_data)[key]
        if (array.isNotEmpty()) {
            if (!isExist) {
                if (rule.missKey == MissKey.Null && optional) {
                    return null
                } else {
                    return if (rule.missKey == MissKey.Keep) cur else _nList<T>(array, array.size)
                }
            } else if (_data is List<*>) {
                return _nArray<T>(
                    _data as List<Any?>,
                    key,
                    array,
                    optional,
                    (cur as? MutableList<Any?>) ?: _nList<T>(array, array.size),
                    def,
                    1,
                    rule
                )
            } else if (optional && _data == null) {
                return null
            } else {
                if (rule.diffType == DiffType.Null && optional) {
                    return null
                } else {
                    return if (rule.diffType == DiffType.Keep) cur else _nList<T>(array, array.size)
                }
            }
        } else {
            if (def is Json2class) {
                if (!isExist) {
                    if (rule.missKey == MissKey.Null && optional) {
                        return null
                    } else {
                        return if (rule.missKey == MissKey.Keep) cur else def.toNew()
                    }
                } else if (_data is Map<*, *>) {
                    return ((cur as? Json2class) ?: def.toNew()).fromJson(_data, rule = rule)
                } else if (optional && _data == null) {
                    return null
                } else {
                    if (rule.diffType == DiffType.Null && optional) {
                        return null
                    } else {
                        return if (rule.diffType == DiffType.Keep) cur else def.toNew()
                    }
                }
            } else {
                if (!isExist) {
                    if (rule.missKey == MissKey.Null && optional) {
                        return null
                    } else {
                        return if (rule.missKey == MissKey.Keep) cur else def
                    }
                } else if (_isSameSimple(_data, def)) {
                    return _data
                } else if (optional && _data == null) {
                    return null
                } else {
                    if (rule.diffType == DiffType.Null && optional) {
                        return null
                    } else {
                        return if (rule.diffType == DiffType.Keep) cur else def
                    }
                }
            }
        }
    }

    protected fun _toJson(data: Any?): Any? {
        return when (data) {
            is List<*> -> data.map { if (it is Json2class) it.toJson() else it }
            is Json2class -> data.toJson()
            else -> data
        }
    }
}
