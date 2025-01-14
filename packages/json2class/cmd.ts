import { program, Option } from 'commander';
import Path from 'path';
import Fs from 'fs';
import { Json2classBin } from './bin';
import { Json2classBase } from '.';

program.version('0.0.1', '-v --version', 'current version');
program.option('-d, --debug', 'output extra debugging');

program
  .description('generate class entity type based on json config')
  .command('make')
  .addOption(
    new Option('-l, --language <language>', 'specify the language for generating code')
      .choices(Object.values(Json2classBase.Language))
      .makeOptionMandatory(),
  )
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

  .action(async options => {
    const { bin } = Json2classBin;
    const { func } = Json2classBase;

    const workspace = Path.resolve(options.workspace);
    bin.dirIsExist(workspace);

    const output = Path.resolve(options.output || workspace);
    bin.dirIsExist(output);

    func.envJson2class.language = options.language;

    bin.class2file(bin.searchJsons(workspace)).forEach((code, file) => {
      Fs.writeFileSync(`${output}/${file}`, code);
    });
  });

program.parseAsync().catch(e => Json2classBin.bin.exit(e));
