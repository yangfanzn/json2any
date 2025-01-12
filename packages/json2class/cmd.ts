import { program } from 'commander';
import Path from 'path';
import Fs from 'fs';
import { Json2classBin } from './bin';

// 设置多个公共配置
program.version('0.0.1', '-v --version', 'current version');
program.option('-d, --debug', 'output extra debugging');

// <必选> [可选]
// action(command1, command2, ..., options对象)
program
  .description('generate class entity type based on json config')
  .command('make <type>')
  .option(
    '-w, --workspace <workspace>',
    'specifies the workspace directory (default is current directory) for json config search.',
    '.',
  )
  .option(
    '-o, --output <output>',
    'specify the output directory for build artifacts (defaults to the workspace directory if not provided)',
    '.',
  )
  .action(async (type, options) => {
    const { bin } = Json2classBin;

    bin.isSupported(type);

    const workspace = Path.resolve(options.workspace);
    bin.dirIsExist(workspace);

    const output = Path.resolve(options.output || workspace);
    bin.dirIsExist(output);

    bin.class2file(bin.searchJsons(workspace), type).forEach((code, file) => {
      Fs.writeFileSync(`${output}/${file}`, code);
    });
  });

program.parseAsync().catch(e => Json2classBin.bin.exit(e));
