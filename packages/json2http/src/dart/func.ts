import { Func as _Func, InterHttp } from '../base';

class Func extends _Func implements InterHttp {}

export const func = new Func();
