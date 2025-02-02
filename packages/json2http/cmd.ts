import { Option, program } from 'commander';
import Path from 'path';
import Fs from 'fs';
import { bin } from './src/bin';
import * as Base from './src/base';

import { Json2classBase as Json2classBase_Bin } from 'json2class/bin';
import { Json2classBase } from 'json2class';

import { version, author } from './package.json';
Base.env.version = Json2classBase.env.version = Json2classBase_Bin.env.version = version;
Base.env.author = Json2classBase.env.author = Json2classBase_Bin.env.author = author;

const description = [
  'generate http request function based on JSON configuration',
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
    'specify the search directory (default is current directory) for json config search.',
    '.',
  )
  .option(
    '-o, --output <output>',
    'specify the output directory for build artifacts (defaults to the search directory if not provided)',
  )
  .option(
    '-x, --extend <extend>',
    'specify a path for the extension file (default is the file named `extend` in the output directory)',
  )
  .addOption(
    new Option(
      '-a, --default-agent <defaultAgent>',
      [
        'to facilitate usage, built-in agents for different languages have been provided',
        `you can specify one for your runtime environment, there are [${Object.values(Base.DefaultAgent)}]`,
      ].join('\n'),
    ).choices(Object.values(Base.DefaultAgent)),
  )
  .action(async options => {
    const { env, func, DefaultAgent, Language } = Base;

    const search = Path.resolve(options.search);
    bin.dirIsExist(search);

    const output = Path.resolve(options.output || search);
    bin.dirIsExist(output);

    env.debug = Json2classBase.env.debug = Json2classBase_Bin.env.debug = !!options.debug;
    env.language = Json2classBase.env.language = Json2classBase_Bin.env.language = options.language;
    const { desc, ext } = func.language(env.language);
    const extend =
      options.extend === ''
        ? ''
        : Path.resolve(options.extend === undefined ? `${output}/extend.${ext}` : options.extend);
    if (extend) {
      try {
        bin.fileIsExit(extend);
      } catch (e) {
        if (options.extend === undefined) {
          Fs.writeFileSync(extend, require(`./src/${desc}/extend.txt`).default);
        } else {
          throw e;
        }
      }
    }

    env.search = Json2classBase.env.search = Json2classBase_Bin.env.search = search;
    env.output = output;
    env.extend = bin.parseExtend(output, extend);
    let defaultAgent = options.defaultAgent;
    if (!defaultAgent) {
      switch (env.language) {
        case Language.Dart3:
          defaultAgent = DefaultAgent.Dart_Dio5;
          break;
        case Language.ArkTs0:
          defaultAgent = DefaultAgent.ArkTs_Rcp0;
          break;
      }
    }

    if (!defaultAgent.startsWith(`${desc}_`)) {
      func.assertError(`the set language(${env.language}) does not match the agent(${defaultAgent})`);
    }
    env.defaultAgent = defaultAgent;

    bin.http2file(bin.json2piece(search)).forEach((code, file) => {
      Fs.writeFileSync(`${output}/${file}`, code);
    });
  });

program.parseAsync().catch(e => bin.exit(e));
