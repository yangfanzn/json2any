import { program } from 'commander';
import Path from 'path';
import Fs from 'fs';
import { tools, Base } from './bin';
import { Supported } from './src/base';

// 设置多个公共配置
program.version('0.0.1', '-v --version', 'current version');
program.option('-d, --debug', 'output extra debugging');

// <必选> [可选]
// action(command1, command2, ..., options对象)
program
  .description('generate http request function based on JSON configuration')
  .command('make <type>')
  // .option('', '')
  .action(async (type, options) => {
    Base.bin.isSupported(type, Object.values(Supported));
    const bin = tools(type);

    // todo: 同 json2class
    const workspace = Path.resolve('.');
    // Shelljs.rm('-rf', cache);
    // Shelljs.mkdir('-p', cache);

    bin.http2file(bin.json2piece(workspace)).forEach((code, file) => {
      Fs.writeFileSync(`${workspace}/${file}`, code);
    });

    // format: Shelljs.exec 会报错
    // ChildProcess.exec(bin.format);
  });

program.parse();
