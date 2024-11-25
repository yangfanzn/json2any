enum DiffType { Keep, Default, Null }

enum MissKey { Keep, Default, Null }

// 输入比原始坑位多(大时)
// Fill: 按输入填充
// -- 类型不一致时，根据字段是否可选填充 默认值 / null
// Drop: (对齐)丢弃多余的输入数据，保持原始坑位
// Null: 多余的数据填充为 null 值
// -- 跟类型一致没有关系
// -- 非可选字段强制 Null 等同 Fill
enum MoreIndex { Fill, Drop, Null }

// 输入比原始坑位少(小时)
// Fill: 填充默认值，因为这里没有输入，只能填充默认值
// -- 数组会递归给默认值，最后保证与原始坑位结构一致
// -- 即使类型不一致，可选字段，也只给默认值，要给 null，通过 Null 配置实现
// Drop: (对齐)丢弃多余的原始坑位，保持输入数据
// Null: 将多余的坑位设置为 null 值
// -- 跟类型一致没有关系
// -- 非可选字段强制 Null 等同 Fill
// Skip: 多余的坑位不做处理，保留坑位值
enum MissIndex { Fill, Drop, Null, Skip }

class Option {
  MissKey missKey = MissKey.Null;
  DiffType diffType = DiffType.Null;
  MoreIndex moreIndex = MoreIndex.Fill;
  MissIndex missIndex = MissIndex.Skip;

  create() {
    return Option()
      ..missKey = missKey
      ..diffType = diffType
      ..moreIndex = moreIndex
      ..missIndex = missIndex;
  }
}

abstract class Cls {
  static final Option option = Option();

  Cls fromJson(dynamic data,
      {Option Function(Option option)? setOption, Option? option});

  Cls create();

  _isSameSimple(dynamic source, dynamic target) {
    return source.runtimeType == target.runtimeType ||
        (source is num && target is num);
  }

  _nList<T>(List<bool> array, int n) {
    switch (array) {
      case [true]:
        return <T?>[];
      case [false]:
        return <T>[];

      case [true, true]:
        if (n == 1) {
          return <T?>[];
        }
        return <List<T?>?>[];
      case [true, false]:
        if (n == 1) {
          return <T>[];
        }
        return <List<T>?>[];
      case [false, true]:
        if (n == 1) {
          return <T?>[];
        }
        return <List<T?>>[];
      case [false, false]:
        if (n == 1) {
          return <T>[];
        }
        return <List<T>>[];

      case [true, true, true]:
        if (n == 1) {
          return <T?>[];
        } else if (n == 2) {
          return <List<T?>?>[];
        }
        return <List<List<T?>?>?>[];
      case [true, true, false]:
        if (n == 1) {
          return <T>[];
        } else if (n == 2) {
          return <List<T>?>[];
        }
        return <List<List<T>?>?>[];
      case [true, false, true]:
        if (n == 1) {
          return <T?>[];
        } else if (n == 2) {
          return <List<T?>>[];
        }
        return <List<List<T?>>?>[];
      case [true, false, false]:
        if (n == 1) {
          return <T>[];
        } else if (n == 2) {
          return <List<T>>[];
        }
        return <List<List<T>>?>[];
      case [false, true, true]:
        if (n == 1) {
          return <T?>[];
        } else if (n == 2) {
          return <List<T?>?>[];
        }
        return <List<List<T?>?>>[];
      case [false, true, false]:
        if (n == 1) {
          return <T>[];
        } else if (n == 2) {
          return <List<T>?>[];
        }
        return <List<List<T>?>>[];
      case [false, false, true]:
        if (n == 1) {
          return <T?>[];
        } else if (n == 2) {
          return <List<T?>>[];
        }
        return <List<List<T?>>>[];
      case [false, false, false]:
        if (n == 1) {
          return <T>[];
        } else if (n == 2) {
          return <List<T>>[];
        }
        return <List<List<T>>>[];
    }

    // 无法动态创建 N 维数组类型
    throw '最大支持三维数组';
  }

  _nArray<T>(List data, String key, List<bool> array, bool optional, List cur,
      dynamic def, int level, Option option) {
    dynamic t = _nList<T>(array, array.length - level + 1);
    for (int i = 0; i < data.length; i++) {
      bool isExist = cur.length > i; // 当前输入数据是否有空位落
      dynamic _data = data.elementAtOrNull(i);
      dynamic _cur = cur.elementAtOrNull(i);
      if (array.length == level) {
        // 到达数据层
        if (def is Cls) {
          if (!isExist) {
            if (option.moreIndex == MoreIndex.Null && array[level - 1]) {
              t.add(null);
            } else {
              if (option.moreIndex == MoreIndex.Drop) {
                // 丢弃，如果是 MissKey.Null，又不是可选字段，默认行为是 Fill
              } else {
                // 填充
                if (_data is Map) {
                  if (_cur != null && _cur is! Cls) {
                    throw '不可能出现: 不为空的数组当前值应该与传入的默认值类型一致';
                  }
                  t.add((_cur ?? def.create()).fromJson(_data, option: option));
                } else if (array[level - 1]) {
                  t.add(null);
                } else {
                  // 类型不一致时，只要是可选字段都设置为 null
                  // 其他情况给默认值
                  t.add(def.create());
                }
              }
            }
          } else if (_data is Map) {
            if (_cur != null && _cur is! Cls) {
              throw '不可能出现: 不为空的数组当前值应该与传入的默认值类型一致';
            }
            t.add((_cur ?? def.create()).fromJson(_data, option: option));
          } else if (array[level - 1] && _data == null) {
            t.add(null);
          } else {
            if (option.diffType == DiffType.Null && array[level - 1]) {
              t.add(null);
            } else {
              t.add(option.diffType == DiffType.Keep ? _cur : def.create());
            }
          }
        } else {
          if (!isExist) {
            if (option.moreIndex == MoreIndex.Null && array[level - 1]) {
              t.add(null);
            } else {
              if (option.moreIndex == MoreIndex.Drop) {
                // 丢弃，如果是 MissKey.Null，又不是可选字段，默认行为是 Fill
              } else {
                // 填充
                if (_isSameSimple(_data, def)) {
                  t.add(_data);
                } else if (array[level - 1]) {
                  t.add(null);
                } else {
                  // 类型不一致时，只要是可选字段都设置为 null
                  // 其他情况给默认值
                  t.add(def);
                }
              }
            }
          } else if (_isSameSimple(_data, def)) {
            t.add(_data);
          } else if (array[level - 1] && _data == null) {
            t.add(null);
          } else {
            if (option.diffType == DiffType.Null && array[level - 1]) {
              t.add(null);
            } else {
              t.add(option.diffType == DiffType.Keep ? _cur : def);
            }
          }
        }
      } else {
        if (!isExist) {
          if (option.moreIndex == MoreIndex.Null && array[level - 1]) {
            t.add(null);
          } else {
            if (option.moreIndex == MoreIndex.Drop) {
              // 丢弃，如果是 MissKey.Null，又不是可选字段，默认行为是 Fill
            } else if (_data is List) {
              // 填充
              t.add(_nArray<T>(
                _data,
                key,
                array,
                optional,
                _nList<T>(array, array.length - level),
                def,
                level + 1,
                option,
              ));
            } else {
              // 剩下的 Fill 在坑位不存在的情况下，根据是否可选决定填充内容
              t.add(array[level - 1]
                  ? null
                  : _nList<T>(array, array.length - level));
            }
          }
        } else if (_data is List) {
          t.add(_nArray<T>(
            _data,
            key,
            array,
            optional,
            _cur == null ? _nList<T>(array, array.length - level) : _cur,
            def,
            level + 1,
            option,
          ));
        } else if (array[level - 1] && _data == null) {
          t.add(null);
        } else {
          if (option.diffType == DiffType.Null && array[level - 1]) {
            t.add(null);
          } else if (option.diffType == DiffType.Keep) {
            t.add(_cur);
          } else {
            if (cur.length > data.length &&
                _cur != null &&
                (option.missIndex == MissIndex.Fill ||
                    // 非可选的Null 同 Fill, 小时 Fill 就是默认值
                    (option.missIndex == MissIndex.Null &&
                        !array[level - 1]))) {
              // 弥补下面[小时]循环的不足
              // 当类型不一致时，数组默认值需要递归
              t.add(_nArray<T>(
                _nList<T>(array, array.length - level),
                key,
                array,
                optional,
                _cur,
                def,
                level + 1,
                option,
              ));
            } else {
              t.add(_nList<T>(array, array.length - level));
            }
          }
        }
      }
    }

    // 下面是可能进入的 MissIndex 的逻辑，输入少，位置多(小时)
    if (option.missIndex != MissIndex.Drop) {
      // 进不来的就会丢弃多余坑位
      for (int i = 0; i < cur.length - data.length; i++) {
        if (array.length == level) {
          // 到达数据层
          if (option.missIndex == MissIndex.Null && array[level - 1]) {
            t.add(null);
          } else if (option.missIndex == MissIndex.Skip) {
            // 保持原始值
            t.add(cur[data.length + i]);
          } else {
            // 如果是 MissIndex.Null，又不是可选字段，默认行为是 Fill 默认值
            if (def is Cls) {
              t.add(def.create());
            } else {
              t.add(def);
            }
          }
        } else {
          if (option.missIndex == MissIndex.Null && array[level - 1]) {
            t.add(null);
          } else if (option.missIndex == MissIndex.Skip) {
            // 保持原始值
            t.add(cur[data.length + i]);
          } else {
            if (cur[data.length + i] == null) {
              t.add(null);
            } else {
              // 如果是 MissIndex.Null，又不是可选字段，默认行为是 Fill 默认值
              t.add(_nArray<T>(
                _nList<T>(array, array.length - level),
                key,
                array,
                optional,
                // 这里有可能是 null，才有了上面分支的逻辑
                cur[data.length + i],
                def,
                level + 1,
                option,
              ));
            }
          }
        }
      }
    }

    return t;
  }

  setVal<T>(dynamic data, String key, List<bool> array, bool optional,
      dynamic cur, dynamic def, Option option) {
    bool isExist = true;
    if (data is! Map) {
      data = {};
    }
    isExist = data.containsKey(key);
    data = data[key];
    if (array.length > 0) {
      if (!isExist) {
        if (option.missKey == MissKey.Null && optional) {
          return null;
        } else {
          return option.missKey == MissKey.Keep
              ? cur
              : _nList<T>(array, array.length);
        }
      } else if (data is List) {
        return _nArray<T>(data, key, array, optional,
            cur == null ? _nList<T>(array, array.length) : cur, def, 1, option);
      } else if (optional && data == null) {
        return null;
      } else {
        if (option.diffType == DiffType.Null && optional) {
          return null;
        } else {
          return option.diffType == DiffType.Keep
              ? cur
              : _nList<T>(array, array.length);
        }
      }
    } else {
      if (def is Cls) {
        if (!isExist) {
          if (option.missKey == MissKey.Null && optional) {
            return null;
          } else {
            return option.missKey == MissKey.Keep ? cur : def.create();
          }
        } else if (data is Map) {
          return (cur ?? def.create()).fromJson(data, option: option);
        } else if (optional && data == null) {
          return null;
        } else {
          if (option.diffType == DiffType.Null && optional) {
            return null;
          } else {
            return option.diffType == DiffType.Keep ? cur : def.create();
          }
        }
      } else {
        if (!isExist) {
          if (option.missKey == MissKey.Null && optional) {
            return null;
          } else {
            return option.missKey == MissKey.Keep ? cur : def;
          }
        } else if (_isSameSimple(data, def)) {
          return data;
        } else if (optional && data == null) {
          return null;
        } else {
          if (option.diffType == DiffType.Null && optional) {
            return null;
          } else {
            return option.diffType == DiffType.Keep ? cur : def;
          }
        }
      }
    }
  }
}
