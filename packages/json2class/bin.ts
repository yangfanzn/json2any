import { program as Program } from 'commander';
import Path from 'path';
import Fs from 'fs';
import Shelljs from 'shelljs';
import Json2class, { bin } from 'json2class';

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
      bin.exit(`The following languages are currently supported: ${support.join(' / ')}`);
    }
    const codes = bin.searchJsons(Path.resolve('.')).reduce((codes, cur) => {
      codes.push(
        ...Json2class(cur.name, cur.json, 'dart')
          .toClass()
          .map(e => e.code),
      );
      return codes;
    }, [] as string[]);
    const cache = Path.resolve('./json2class');
    // Shelljs.rm('-rf', cache); // todo: 担心误删
    Shelljs.mkdir('-p', cache);
    Fs.writeFileSync(
      `${cache}/index.dart`,
      [Fs.readFileSync(Path.resolve(__dirname, `../src/${type}/origin.${type}`)), ...codes].join('\n'),
    );
  });

Program.parse();
