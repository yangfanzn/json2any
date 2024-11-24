import { program as Program } from 'commander';
import Path from 'path';
import Fs from 'fs';
import Shelljs from 'shelljs';

// 设置多个公共配置
Program.version('0.0.1', '-v --version', 'current version');
Program.option('-d, --debug', 'output extra debugging');

// <必选> [可选]
// action(command1, command2, ..., options对象)
Program.description('Generate class entity type based on JSON configuration')
  .command('make <type>')
  // .option('', '')
  .action(async (type, options) => {
    const support = ['dart', 'ts', 'oc'];
    if (!support.includes(type)) {
      console.log(`The following languages are currently supported: ${support.join(' / ')}`);
      Shelljs.exit(1);
    }
    const { default: json5 } = await import('json5');
    const { default: json2class, bin } = await import('json2class');
    const searchDir = Path.resolve('.');
    const jsons = bin.readDir(searchDir, { ext: ['.json5', '.json'], ignore: /\/\./ });
    const codes: string[] = [];
    jsons.forEach(file => {
      const name =
        file
          .replace(/\.\w+$/, '')
          .split(searchDir)
          .pop()
          ?.replace(/\//g, '') ?? 'root';
      const json = json5.parse(Fs.readFileSync(file).toString());
      codes.push(
        ...json2class(name, json, 'dart')
          .toClass()
          .map(e => e.code),
      );
    });
    const cache = Path.resolve(`./${type}/cache`);
    Shelljs.rm('-rf', cache);
    Shelljs.mkdir('-p', cache);
    Fs.writeFileSync(
      `${cache}/index.dart`,
      [Fs.readFileSync(Path.resolve(__dirname, `../src/${type}/origin.${type}`)), ...codes].join('\n'),
    );
  });

Program.parse();
