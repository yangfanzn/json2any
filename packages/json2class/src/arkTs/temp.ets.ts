export type Any = Object | null;
function isMapLike(x: Any) {
  return x !== null && !(x instanceof Array) && typeof x === 'object';
}

export enum DiffType {
  Keep,
  Default,
  Null,
}
export enum MissKey {
  Keep,
  Default,
  Null,
}
export enum MoreIndex {
  Fill,
  Drop,
  Null,
}
export enum MissIndex {
  Fill,
  Drop,
  Null,
  Skip,
}

export class Rule {
  missKey = MissKey.Null;
  diffType = DiffType.Null;
  moreIndex = MoreIndex.Fill;
  missIndex = MissIndex.Skip;
  copy() {
    const rule = new Rule();
    rule.missKey = this.missKey;
    rule.diffType = this.diffType;
    rule.moreIndex = this.moreIndex;
    rule.missIndex = this.missIndex;
    return rule;
  }
}

export class Json2classError implements Error {
  readonly name: string;
  readonly message: string;
  constructor(message: string) {
    this.name = 'Json2classError';
    this.message = message;
  }

  toString() {
    return [
      `${this.name}: ${this.message}`,
      'the occurrence of this error indicates an unexpected situation in the program,',
      'please report this error to the @author@. Thank you very much!',
    ].join('\n');
  }
}

export abstract class Json2class {
  static defaultRule = new Rule();

  rule?: Rule;

  fromAny(data: Any, setRule?: (rule: Rule) => void, rule?: Rule): Json2class {
    try {
      data = JSON.parse(`${data}`);
    } catch (e) {}
    return this.fromJson(data, setRule, rule);
  }

  abstract fromJson(data: Any, setRule?: (rule: Rule) => void, rule?: Rule): Json2class;

  preset = '';

  fromPreset(setRule?: (rule: Rule) => void, rule?: Rule): Json2class {
    return this.fromAny(this.preset, setRule, rule);
  }

  abstract toNew(): Json2class;

  abstract toJson(): Record<string, Any>;

  private _isSameSimple(source: Any, target: Any) {
    return typeof source === typeof target;
  }

  _nList<T>(array: boolean[], n: number) {
    return [];
  }

  _nArray<T>(
    data: Any[],
    key: string,
    array: boolean[],
    optional: boolean,
    cur: Any[],
    def: Any,
    level: number,
    rule: Rule,
  ) {
    const t: Any[] = this._nList<T>(array, array.length - level + 1);
    for (let i = 0; i < data.length; i++) {
      const isExist = cur.length > i;
      const _data = data[i] ?? null;
      const _cur = cur[i] ?? null;
      if (array.length === level) {
        if (def instanceof Json2class) {
          if (!isExist) {
            if (rule.moreIndex === MoreIndex.Null && array[level - 1]) {
              t.push(null);
            } else {
              if (rule.moreIndex === MoreIndex.Drop) {
              } else {
                if (isMapLike(_data)) {
                  if (_cur !== null && !(_cur instanceof Json2class)) {
                    throw new Json2classError(
                      'the current value of a non-empty array should match the type of the provided default value',
                    );
                  }
                  t.push(((_cur as Json2class) ?? def.toNew()).fromJson(_data, undefined, rule));
                } else if (array[level - 1]) {
                  t.push(null);
                } else {
                  t.push(def.toNew());
                }
              }
            }
          } else if (isMapLike(_data)) {
            if (_cur !== null && !(_cur instanceof Json2class)) {
              throw new Json2classError(
                'the current value of a non-empty array should match the type of the provided default value',
              );
            }
            t.push(((_cur as Json2class) ?? def.toNew()).fromJson(_data, undefined, rule));
          } else if (array[level - 1] && _data === null) {
            t.push(null);
          } else {
            if (rule.diffType === DiffType.Null && array[level - 1]) {
              t.push(null);
            } else {
              t.push(rule.diffType === DiffType.Keep ? _cur : def.toNew());
            }
          }
        } else {
          if (!isExist) {
            if (rule.moreIndex === MoreIndex.Null && array[level - 1]) {
              t.push(null);
            } else {
              if (rule.moreIndex === MoreIndex.Drop) {
              } else {
                if (this._isSameSimple(_data, def)) {
                  t.push(_data);
                } else if (array[level - 1]) {
                  t.push(null);
                } else {
                  t.push(def);
                }
              }
            }
          } else if (this._isSameSimple(_data, def)) {
            t.push(_data);
          } else if (array[level - 1] && _data === null) {
            t.push(null);
          } else {
            if (rule.diffType === DiffType.Null && array[level - 1]) {
              t.push(null);
            } else {
              t.push(rule.diffType === DiffType.Keep ? _cur : def);
            }
          }
        }
      } else {
        if (!isExist) {
          if (rule.moreIndex === MoreIndex.Null && array[level - 1]) {
            t.push(null);
          } else {
            if (rule.moreIndex === MoreIndex.Drop) {
            } else if (_data instanceof Array) {
              t.push(
                this._nArray<T>(
                  _data,
                  key,
                  array,
                  optional,
                  this._nList<T>(array, array.length - level),
                  def,
                  level + 1,
                  rule,
                ),
              );
            } else {
              t.push(array[level - 1] ? null : this._nList<T>(array, array.length - level));
            }
          }
        } else if (_data instanceof Array) {
          t.push(
            this._nArray<T>(
              _data,
              key,
              array,
              optional,
              _cur === null ? this._nList<T>(array, array.length - level) : (_cur as Any[]),
              def,
              level + 1,
              rule,
            ),
          );
        } else if (array[level - 1] && _data === null) {
          t.push(null);
        } else {
          if (rule.diffType === DiffType.Null && array[level - 1]) {
            t.push(null);
          } else if (rule.diffType === DiffType.Keep) {
            t.push(_cur);
          } else {
            if (
              cur.length > data.length &&
              _cur !== null &&
              (rule.missIndex === MissIndex.Fill || (rule.missIndex === MissIndex.Null && !array[level - 1]))
            ) {
              t.push(
                this._nArray<T>(
                  this._nList<T>(array, array.length - level),
                  key,
                  array,
                  optional,
                  _cur as Any[],
                  def,
                  level + 1,
                  rule,
                ),
              );
            } else {
              t.push(this._nList<T>(array, array.length - level));
            }
          }
        }
      }
    }

    if (rule.missIndex !== MissIndex.Drop) {
      for (let i = 0; i < cur.length - data.length; i++) {
        if (array.length === level) {
          if (rule.missIndex === MissIndex.Null && array[level - 1]) {
            t.push(null);
          } else if (rule.missIndex === MissIndex.Skip) {
            t.push(cur[data.length + i] as Any);
          } else {
            if (def instanceof Json2class) {
              t.push(def.toNew());
            } else {
              t.push(def);
            }
          }
        } else {
          if (rule.missIndex === MissIndex.Null && array[level - 1]) {
            t.push(null);
          } else if (rule.missIndex === MissIndex.Skip) {
            t.push(cur[data.length + i] as Any);
          } else {
            if (cur[data.length + i] === null) {
              t.push(null);
            } else {
              t.push(
                this._nArray<T>(
                  this._nList<T>(array, array.length - level),
                  key,
                  array,
                  optional,
                  cur[data.length + i] as Any[],
                  def,
                  level + 1,
                  rule,
                ),
              );
            }
          }
        }
      }
    }
    return t;
  }

  _fromJson<T>(data: Any, key: string, array: boolean[], optional: boolean, cur: Any, def: Any, rule: Rule): Any {
    let isExist: boolean;
    let _data = data as Record<string, Any>;
    try {
      data = _data[key] ?? null;
      isExist = _data[key] !== undefined;
    } catch (e) {
      data = null;
      isExist = false;
    }
    if (array.length > 0) {
      if (!isExist) {
        if (rule.missKey === MissKey.Null && optional) {
          return null;
        } else {
          return rule.missKey === MissKey.Keep ? cur : this._nList<T>(array, array.length);
        }
      } else if (data instanceof Array) {
        return this._nArray<T>(
          data,
          key,
          array,
          optional,
          cur === null ? this._nList<T>(array, array.length) : (cur as Any[]),
          def,
          1,
          rule,
        );
      } else if (optional && data === null) {
        return null;
      } else {
        if (rule.diffType === DiffType.Null && optional) {
          return null;
        } else {
          return rule.diffType === DiffType.Keep ? cur : this._nList<T>(array, array.length);
        }
      }
    } else {
      if (def instanceof Json2class) {
        if (!isExist) {
          if (rule.missKey === MissKey.Null && optional) {
            return null;
          } else {
            return rule.missKey === MissKey.Keep ? cur : def.toNew();
          }
        } else if (isMapLike(data)) {
          return ((cur as Json2class) ?? def.toNew()).fromJson(data, undefined, rule);
        } else if (optional && data === null) {
          return null;
        } else {
          if (rule.diffType === DiffType.Null && optional) {
            return null;
          } else {
            return rule.diffType === DiffType.Keep ? cur : def.toNew();
          }
        }
      } else {
        if (!isExist) {
          if (rule.missKey === MissKey.Null && optional) {
            return null;
          } else {
            return rule.missKey === MissKey.Keep ? cur : def;
          }
        } else if (this._isSameSimple(data, def)) {
          return data;
        } else if (optional && data === null) {
          return null;
        } else {
          if (rule.diffType === DiffType.Null && optional) {
            return null;
          } else {
            return rule.diffType === DiffType.Keep ? cur : def;
          }
        }
      }
    }
  }

  protected _toJson(data: Any) {
    if (data instanceof Array) {
      return data.map((e: Object): Object => (e instanceof Json2class ? e.toJson() : e ?? null));
    } else if (data instanceof Json2class) {
      return data.toJson();
    } else {
      return data ?? null;
    }
  }
}
