import Fs from 'fs';
import Path from 'path';

class Bin {
  readDir(
    path: string,
    {
      dic = false,
      file = true,
      recursion = true,
      ext,
      ignore,
      level = 1,
    }: {
      dic?: boolean;
      file?: boolean;
      recursion?: boolean | number;
      ext?: Array<string>;
      ignore?: RegExp;
      level?: number;
    } = {},
  ) {
    if (!Fs.existsSync(path)) {
      throw `[${path}] directory does not exist`;
    }
    const files = [] as Array<string>;
    Fs.readdirSync(path).forEach(each => {
      const location = Path.join(path, each).replace(/\\/g, '/');
      if (ignore) {
        if (ignore.test(location)) {
          return;
        }
      }
      const info = Fs.statSync(location);
      if (info.isDirectory()) {
        if (dic) {
          files.push(location);
        }
        if (recursion === true || level < (recursion as number)) {
          files.push(...this.readDir(location, { dic, file, recursion, ext, ignore, level: level + 1 }));
        }
      } else if (info.isFile() && file) {
        if (!ext || ext.indexOf(Path.extname(location)) >= 0) {
          files.push(location);
        }
      }
    });
    return files;
  }
}

export const bin = new Bin();
