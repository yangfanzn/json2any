import { program } from 'commander';
import Path from 'path';
import Fs from 'fs';
import Shelljs from 'shelljs';
import { tools, supported, bin } from './index';

// 设置多个公共配置
program.version('0.0.1', '-v --version', 'current version');
program.option('-d, --debug', 'output extra debugging');

// <必选> [可选]
// action(command1, command2, ..., options对象)
program
  .description('Generate class entity type based on JSON configuration')
  .command('make <type>')
  // .option('', '')
  .action(async (type, options) => {
    bin.isSupported(type, supported);
    const cache = Path.resolve('./json2class');
    // Shelljs.rm('-rf', cache); // todo: 担心误删
    Shelljs.mkdir('-p', cache);
    tools(type)
      .toFiles(bin.searchJsons(Path.resolve('.')))
      .forEach((code, file) => {
        Fs.writeFileSync(`${cache}/${file}`, code);
      });
  });

program.parse();
