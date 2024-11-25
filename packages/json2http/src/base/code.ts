import { _C as _Complex, _S as _Simple } from 'json2class';

export abstract class _C {
  constructor(
    public key: string,
    public method: string,
    public params?: _Complex,
    public form?: _Complex,
    public res?: _Complex,
    public data?: _Complex | _Simple,
  ) {}
}
export abstract class _I {
  abstract toFiles(jsons: Map<string, string>): Map<string, string>;
}

export const supported = ['dart', 'oc'] as ('dart' | 'oc')[];
