import Foundation

private protocol _Optionals { var _self: Any? { get } }

extension Optional: _Optionals { fileprivate var _self: Any? { self } }

func _unwrap(_ x: Any?) -> Any? {
    var x = x
    while true {
        guard let v = x else { return nil }
        if let v = v as? _Optionals {
            x = v._self
            continue
        }
        return v
    }
}

func _parse(_ str: String) -> [String: Any] {
    return (try? JSONSerialization.jsonObject(with: str.data(using: .utf8) ?? Data(), options: [])) as? [String: Any] ?? [:]
}

func _stringify(_ value: Any?) -> String {
    if value is NSNull {
        return "null"
    }
    if let num = value as? NSNumber {
        if CFGetTypeID(num) == CFBooleanGetTypeID() {
            return num.boolValue ? "true" : "false"
        }
        return "\(num)"
    }
    if let str = value as? String {
        // todo: 转义问题
        return "\"\(str)\""
    }
    if let value = _unwrap(value), let data = try? JSONSerialization.data(withJSONObject: value, options: []),
       let jsonString = String(data: data, encoding: .utf8) {
        return jsonString
    }
    return ""
}

func _isNull(_ x: Any?) -> Bool {
    let cur = _unwrap(x) ?? NSNull()
    return cur is NSNull
}

enum DiffType { case Keep, Default, Null }

enum MissKey { case Keep, Default, Null }

enum MoreIndex { case Fill, Drop, Null }

enum MissIndex { case Fill, Drop, Null, Skip }

class Rule {
    var missKey: MissKey = .Null
    var diffType: DiffType = .Null
    var moreIndex: MoreIndex = .Fill
    var missIndex: MissIndex = .Skip

    func copy() -> Rule {
        let newRule = Rule()
        newRule.missKey = missKey
        newRule.diffType = diffType
        newRule.moreIndex = moreIndex
        newRule.missIndex = missIndex
        return newRule
    }
}

class Json2classError: LocalizedError, CustomStringConvertible {
    let message: String

    init(_ message: String) {
        self.message = message
    }

    var description: String {
        [
            "Json2classError: \(message)",
            "the occurrence of this error indicates an unexpected situation in the program,",
            "please report this error to the @author@. Thank you very much!"
        ].joined(separator: "\n")
    }

    var errorDescription: String? {
        description
    }
}

class Json2class {
    required init() {}

    private func mustOverride() {
        fatalError("This method must be overridden by subclass")
    }

    static var defaultRule: Rule = Rule()

    var rule: Rule?

    @discardableResult
    func fromAny(_ data: Any?, setRule: ((Rule) -> Void)? = nil, rule: Rule? = nil) -> Self {
        if let str = data as? String {
            return fromJson(_parse(str), setRule: setRule, rule: rule)
        }
        return fromJson(data, setRule: setRule, rule: rule)
    }

    func fromJson(_ data: Any?, setRule: ((Rule) -> Void)? = nil, rule: Rule? = nil) -> Self {
        mustOverride()
        return self
    }

    var preset: String = ""

    @discardableResult
    func fromPreset(setRule: ((Rule) -> Void)? = nil, rule: Rule? = nil) -> Self {
        return fromAny(preset, setRule: setRule, rule: rule)
    }

    func toNew() -> Self {
        return type(of: self).init()
    }

    func toJson() -> [String: Any] {
        mustOverride()
        return [:]
    }

    private func _isSameSimple(_ source: Any?, _ target: Any?) -> Bool {
        if source is String && target is String { return true }
        if let source = source as? NSNumber, let target = target as? NSNumber {
            return CFGetTypeID(source) == CFGetTypeID(target)
        }
        return false
    }

    private func _nList<T>(_ array: [Bool], _ n: Int, type: T.Type) -> [Any?] {
        switch array {
        case [true]:
            return [T?]().map { $0 as Any }
        case [false]:
            return [T]().map { $0 as Any }

        case [true, true]:
            if n == 1 { return [T?]().map { $0 as Any } }
            return [[T?]?]().map { $0 as Any }
        case [true, false]:
            if n == 1 { return [T]().map { $0 as Any } }
            return [[T]?]().map { $0 as Any }
        case [false, true]:
            if n == 1 { return [T?]().map { $0 as Any } }
            return [[T?]]().map { $0 as Any }
        case [false, false]:
            if n == 1 { return [T]().map { $0 as Any } }
            return [[T]]().map { $0 as Any }

        case [true, true, true]:
            if n == 1 { return [T?]().map { $0 as Any } }
            else if n == 2 { return [[T?]?]().map { $0 as Any } }
            return [[[T?]?]?]().map { $0 as Any }
        case [true, true, false]:
            if n == 1 { return [T]().map { $0 as Any } }
            else if n == 2 { return [[T]?]().map { $0 as Any } }
            return [[[T]?]?]().map { $0 as Any }
        case [true, false, true]:
            if n == 1 { return [T?]().map { $0 as Any } }
            else if n == 2 { return [[T?]]().map { $0 as Any } }
            return [[[T?]]?]().map { $0 as Any }
        case [true, false, false]:
            if n == 1 { return [T]().map { $0 as Any } }
            else if n == 2 { return [[T]]().map { $0 as Any } }
            return [[[T]]?]().map { $0 as Any }
        case [false, true, true]:
            if n == 1 { return [T?]().map { $0 as Any } }
            else if n == 2 { return [[T?]?]().map { $0 as Any } }
            return [[[T?]?]]().map { $0 as Any }
        case [false, true, false]:
            if n == 1 { return [T]().map { $0 as Any } }
            else if n == 2 { return [[T]?]().map { $0 as Any } }
            return [[[T]?]]().map { $0 as Any }
        case [false, false, true]:
            if n == 1 { return [T?]().map { $0 as Any } }
            else if n == 2 { return [[T?]]().map { $0 as Any } }
            return [[[T?]]]().map { $0 as Any }
        case [false, false, false]:
            if n == 1 { return [T]().map { $0 as Any } }
            else if n == 2 { return [[T]]().map { $0 as Any } }
            return [[[T]]]().map { $0 as Any }
        default:
            break
        }
        fatalError(Json2classError("supports up to three-dimensional arrays").description)
    }

    private func _nArray<T>(
        _ data: [Any?],
        _ key: String,
        _ array: [Bool],
        _ optional: Bool,
        _ cur: [Any?],
        _ def: Any?,
        _ level: Int,
        _ rule: Rule,
        type: T.Type
    ) -> [Any?] {
        var t = _nList(array, array.count - level + 1, type: T.self)
        for i in 0..<data.count {
            let isExist = cur.count > i
            let _data = i < data.count ? data[i] : nil
            let _cur = i < cur.count ? cur[i] : nil
            if array.count == level {
                if let def = def as? Json2class {
                    if !isExist {
                        if rule.moreIndex == .Null && array[level - 1] {
                            t.append(nil)
                        } else {
                            if rule.moreIndex == .Drop {
                            } else {
                                if let _data = _data as? [String: Any] {
                                    if _cur == nil {
                                        t.append(def.toNew().fromJson(_data, rule: rule))
                                    } else if let _cur = _cur as? Json2class {
                                        t.append(_cur.fromJson(_data, rule: rule))
                                    } else {
                                        fatalError(Json2classError(
                                            "the current value of a non-empty array should match the type of the provided default value"
                                        ).description)
                                    }
                                } else if array[level - 1] {
                                    t.append(nil)
                                } else {
                                    t.append(def.toNew())
                                }
                            }
                        }
                    } else if let _data = _data as? [String: Any] {
                        if _cur == nil {
                            t.append(def.toNew().fromJson(_data, rule: rule))
                        } else if let _cur = _cur as? Json2class {
                            t.append(_cur.fromJson(_data, rule: rule))
                        } else {
                            fatalError(Json2classError(
                                "the current value of a non-empty array should match the type of the provided default value"
                            ).description)
                        }
                    } else if array[level - 1] && _isNull(_data) {
                        t.append(nil)
                    } else {
                        if rule.diffType == .Null && array[level - 1] {
                            t.append(nil)
                        } else {
                            t.append(rule.diffType == .Keep ? _cur : def.toNew())
                        }
                    }
                } else {
                    if !isExist {
                        if rule.moreIndex == .Null && array[level - 1] {
                            t.append(nil)
                        } else {
                            if rule.moreIndex == .Drop {
                            } else {
                                if _isSameSimple(_data, def) {
                                    t.append(_data)
                                } else if array[level - 1] {
                                    t.append(nil)
                                } else {
                                    t.append(def)
                                }
                            }
                        }
                    } else if _isSameSimple(_data, def) {
                        t.append(_data)
                    } else if array[level - 1] && _isNull(_data) {
                        t.append(nil)
                    } else {
                        if rule.diffType == .Null && array[level - 1] {
                            t.append(nil)
                        } else {
                            t.append(rule.diffType == .Keep ? _cur : def)
                        }
                    }
                }
            } else {
                if !isExist {
                    if rule.moreIndex == .Null && array[level - 1] {
                        t.append(nil)
                    } else {
                        if rule.moreIndex == .Drop {
                        } else if let _data = _data as? [Any] {
                            t.append(_nArray(
                                _data,
                                key,
                                array,
                                optional,
                                _nList(array, array.count - level, type: T.self),
                                def,
                                level + 1,
                                rule,
                                type: T.self
                            ))
                        } else {
                            t.append(array[level - 1] ? nil : _nList(array, array.count - level, type: T.self))
                        }
                    }
                } else if let _data = _data as? [Any] {
                    t.append(_nArray(
                        _data,
                        key,
                        array,
                        optional,
                        _cur as? [Any?] ?? _nList(array, array.count - level, type: T.self),
                        def,
                        level + 1,
                        rule,
                        type: T.self
                    ))
                } else if array[level - 1] && _isNull(_data) {
                    t.append(nil)
                } else {
                    if rule.diffType == .Null && array[level - 1] {
                        t.append(nil)
                    } else if rule.diffType == .Keep {
                        t.append(_cur)
                    } else {
                        if cur.count > data.count &&
                            _cur != nil &&
                            (rule.missIndex == .Fill ||
                                (rule.missIndex == .Null && !array[level - 1])) {
                            t.append(_nArray(
                                _nList(array, array.count - level, type: T.self),
                                key,
                                array,
                                optional,
                                _cur as? [Any] ?? [],
                                def,
                                level + 1,
                                rule,
                                type: T.self
                            ))
                        } else {
                            t.append(_nList(array, array.count - level, type: T.self))
                        }
                    }
                }
            }
        }

        if rule.missIndex != .Drop {
            for i in 0..<max(0, cur.count - data.count) {
                if array.count == level {
                    if rule.missIndex == .Null && array[level - 1] {
                        t.append(nil)
                    } else if rule.missIndex == .Skip {
                        t.append(cur[data.count + i])
                    } else {
                        if let def = def as? Json2class {
                            t.append(def.toNew())
                        } else {
                            t.append(def)
                        }
                    }
                } else {
                    if rule.missIndex == .Null && array[level - 1] {
                        t.append(nil)
                    } else if rule.missIndex == .Skip {
                        t.append(cur[data.count + i])
                    } else {
                        if _isNull(cur[data.count + i]) {
                            t.append(nil)
                        } else {
                            t.append(_nArray(
                                _nList(array, array.count - level, type: T.self),
                                key,
                                array,
                                optional,
                                cur[data.count + i] as? [Any] ?? [],
                                def,
                                level + 1,
                                rule,
                                type: T.self
                            ))
                        }
                    }
                }
            }
        }
        return t
    }

    fileprivate func _fromJson<T>(
        _ data: Any?,
        _ key: String,
        _ array: [Bool],
        _ optional: Bool,
        _ cur: Any?,
        _ def: Any?,
        _ rule: Rule,
        type: T.Type
    ) -> Any? {
        let data = data as? [String: Any] ?? [:]
        let isExist = data.keys.contains(key)
        let _data = data[key] ?? nil
        if array.count > 0 {
            if !isExist {
                if rule.missKey == .Null && optional {
                    return nil
                } else {
                    return rule.missKey == .Keep ? cur : _nList(array, array.count, type: T.self)
                }
            } else if let _data = _data as? [Any] {
                return _nArray(
                    _data,
                    key,
                    array,
                    optional,
                    cur as? [Any?] ?? _nList(array, array.count, type: T.self),
                    def,
                    1,
                    rule,
                    type: T.self
                )
            } else if optional && _isNull(_data) {
                return nil
            } else {
                if rule.diffType == .Null && optional {
                    return nil
                } else {
                    return rule.diffType == .Keep ? cur : _nList(array, array.count, type: T.self)
                }
            }
        } else {
            if let def = def as? Json2class {
                if !isExist {
                    if rule.missKey == .Null && optional {
                        return nil
                    } else {
                        return rule.missKey == .Keep ? cur : def.toNew()
                    }
                } else if let _data = _data as? [String: Any] {
                    return (cur as? Json2class ?? def.toNew()).fromJson(_data, rule: rule)
                } else if optional && _isNull(_data) {
                    return nil
                } else {
                    if rule.diffType == .Null && optional {
                        return nil
                    } else {
                        return rule.diffType == .Keep ? cur : def.toNew()
                    }
                }
            } else {
                if !isExist {
                    if rule.missKey == .Null && optional {
                        return nil
                    } else {
                        return rule.missKey == .Keep ? cur : def
                    }
                } else if _isSameSimple(_data, def) {
                    return _data
                } else if optional && _isNull(_data) {
                    return nil
                } else {
                    if rule.diffType == .Null && optional {
                        return nil
                    } else {
                        return rule.diffType == .Keep ? cur : def
                    }
                }
            }
        }
    }

    fileprivate func _toJson(_ data: Any?) -> Any {
        if let data = data as? [Any] {
            return data.map { e in (e as? Json2class)?.toJson() ?? _toJson(e) }
        } else if let data = data as? Json2class {
            return data.toJson()
        } else {
            return _unwrap(data) ?? NSNull()
        }
    }
}
