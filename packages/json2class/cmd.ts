import { program, Option } from 'commander';
import Path from 'path';
import Fs from 'fs';
import { bin } from './src/bin';
import * as Base from './src/base';

import { version, author } from './package.json';

Base.env.version = version;
Base.env.author = author;

const description = [
  'generate class entity type based on json config',
  `currently supported languages: ${Object.values(Base.Language)}`,
].join('\n');

program.description(description).version(version, '-v --version', 'current version');

program
  .description(description)
  .command('build')
  .option('-d, --debug', 'output extra debugging')
  .addOption(
    new Option('-l, --language <language>', 'specify the language for generating code')
      .choices(Object.values(Base.Language))
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
    const { env } = Base;

    const search = Path.resolve(options.search);
    bin.dirIsExist(search);

    const output = Path.resolve(options.output || search);
    bin.dirIsExist(output);

    env.debug = !!options.debug;
    env.language = options.language;
    env.search = search;

    bin.class2file(bin.searchJsons(search)).forEach((code, file) => {
      Fs.writeFileSync(`${output}/${file}`, code);
    });
  });

program.parseAsync().catch(e => bin.exit(e));
