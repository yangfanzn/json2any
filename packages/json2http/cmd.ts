import { program, Option } from 'commander';
import Path from 'path';
import Fs from 'fs';
import { tools, Base } from './bin';
import { Supported } from './src/base';
import { test } from './src/base/test';

// 设置多个公共配置
program.version('0.0.1', '-v --version', 'current version');
program.option('-d, --debug', 'output extra debugging');

// <必选> [可选]
// action(command1, command2, ..., options对象)
program
  .description('generate http request function based on JSON configuration')
  .command('make <type>') // todo: type 设置可选值
  .option(
    '-w, --workspace <workspace>',
    'specify the workspace directory (default is current directory) for json config search.',
    '.',
  )
  .option(
    '-o, --output <output>',
    'specify the output directory for build artifacts (defaults to the workspace directory if not provided)',
    '.',
  )
  .option(
    '-x, --extend <extend>',
    'specify a path for the extension file (default is the file named `extend` in the output directory)',
  )
  .addOption(
    new Option(
      '--executor [executor]',
      'specify a built-in tool for making network requests. defaults to Dio. If set to null, developers must implement their own',
    )
      .default('dio')
      .choices(['dio', 'null']),
  )

  .action(async (type, options) => {
    Base.bin.isSupported(type, Object.values(Supported));
    const bin = tools(type);

    const workspace = Path.resolve(options.workspace);
    bin.dirIsExist(workspace);

    const output = Path.resolve(options.output || workspace);
    bin.dirIsExist(output);

    const extend =
      options.extend === 'null' ? '' : Path.resolve(options.extend === undefined ? `extend.${type}` : options.extend);
    if (options.extend === undefined) {
      // todo: 默认情况，如果文件不存在，则主动创建
    }
    if (extend) {
      bin.fileIsExit(extend);
    }

    bin.envHttp.output = output;
    bin.envHttp.extend = extend;
    bin.envHttp.innerExecutor = options.executor === 'null' ? '' : options.executor;

    // todo: 同 json2class
    // Shelljs.rm('-rf', cache);
    // Shelljs.mkdir('-p', cache);

    bin.http2file(bin.json2piece(workspace)).forEach((code, file) => {
      Fs.writeFileSync(`${output}/${file}`, code);
    });

    // format: Shelljs.exec 会报错
    // ChildProcess.exec(bin.format);
  });

program
  .description('test')
  .command('test', { hidden: true })
  .action(async (type, options) => {
    test();
  });

program.parse();
