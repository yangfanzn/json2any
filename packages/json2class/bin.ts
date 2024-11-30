import { program } from 'commander';
import Path from 'path';
import Fs from 'fs';
import { tools, bin } from './index';

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
    bin.isSupported(type);
    const cache = Path.resolve('.');
    // todo:
    //  大多数语言，一个文件就可以搞定就放在当前目录就好，oc 也就多个头文件，放当前目录问题也不大
    //  web 涉及加载，【可能：其实分开意义也不大】要分多个文件，后面在考虑加一层目录
    // Shelljs.rm('-rf', cache);
    // Shelljs.mkdir('-p', cache);
    tools(type)
      .toFiles(bin.searchJsons(Path.resolve('.')), type)
      .forEach((code, file) => {
        Fs.writeFileSync(`${cache}/${file}`, code);
      });
  });

program.parse();
