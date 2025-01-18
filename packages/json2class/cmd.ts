import { program, Option } from 'commander';
import Path from 'path';
import Fs from 'fs';
import { Json2classBin } from './bin';
import { Json2classBase } from '.';

const description = [
  'generate class entity type based on json config',
  `currently supported languages: ${Object.values(Json2classBase.Language)}`,
].join('\n');

program.description(description).version('0.0.1', '-v --version', 'current version');

program
  .command('build')
  .description(description)
  .addOption(
    new Option('-l, --language <language>', 'specify the language for generating code')
      .choices(Object.values(Json2classBase.Language))
      .makeOptionMandatory(),
  )
  .option(
    '-s, --search <search>',
    'specifies the search directory (default is current directory) for json config search.',
    '.',
  )
  .option(
    '-o, --output <output>',
    'specify the output directory for build artifacts (defaults to the search directory if not provided)',
  )
  .action(async options => {
    const { bin } = Json2classBin;
    const { func } = Json2classBase;

    const search = Path.resolve(options.search);
    bin.dirIsExist(search);

    const output = Path.resolve(options.output || search);
    bin.dirIsExist(output);

    func.envJson2class.language = options.language;

    bin.class2file(bin.searchJsons(search)).forEach((code, file) => {
      Fs.writeFileSync(`${output}/${file}`, code);
    });
  });

program.parseAsync().catch(e => Json2classBin.bin.exit(e));
