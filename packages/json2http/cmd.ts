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
    '-p, --package <package>',
    'specify the package name for the generated code file (if required by the target language, defaults to parsing from the output path automatically)',
  )
  .addOption(
    new Option(
      '-a, --default-agent <defaultAgent>',
      [
        'to facilitate usage, built-in agents for different languages have been provided',
        `you can specify one for your runtime environment`,
      ].join('\n'),
    ).choices(Object.values(Base.DefaultAgent)),
  )
  .addOption(new Option('-e, --entry <entry>', 'specify the entry filename').hideHelp())
  .action(async options => {
    const { env, func, DefaultAgent, Language } = Base;

    const search = Path.resolve(options.search).replace(/\\/g, '/');
    bin.dirIsExist(search);

    const output = Path.resolve(options.output || search).replace(/\\/g, '/');
    bin.dirIsExist(output);

    env.debug = Json2classBase.env.debug = Json2classBase_Bin.env.debug = !!options.debug;
    env.language = Json2classBase.env.language = Json2classBase_Bin.env.language = options.language;
    env.search = Json2classBase.env.search = Json2classBase_Bin.env.search = search;
    env.output = Json2classBase.env.output = Json2classBase_Bin.env.output = output;

    let defaultAgent = options.defaultAgent;
    if (!defaultAgent) {
      switch (env.language) {
        case Language.Dart3:
          defaultAgent = DefaultAgent.Dart_Dio5;
          break;
        case Language.ArkTs12:
          defaultAgent = DefaultAgent.ArkTs_Rcp12;
          break;
        case Language.Typescript5:
          defaultAgent = DefaultAgent.Typescript_Fetch0;
          break;
        case Language.Kotlin1_3:
          defaultAgent = DefaultAgent.Kotlin_OkHttp4;

          env.library = `${
            options.package ?? output.split(new RegExp('/src/main/(java|kotlin)/'))?.[2]?.replace(/\//g, '.') ?? ''
          }`;
          if (env.library) {
            env.library = `package ${env.library}${'\n'.repeat(2)}`;
          }
          break;
        case Language.Swift5_7:
          defaultAgent = DefaultAgent.Swift_Alamofire5;
          break;
      }
    }
    if (!defaultAgent.startsWith(`${func.language(env.language).language}_`)) {
      func.assertError(`the set language(${env.language}) does not match the agent(${defaultAgent})`);
    }
    env.defaultAgent = defaultAgent;

    bin.http2file(bin.json2piece(search), options.entry || 'json2http').forEach((code, file) => {
      Fs.writeFileSync(`${output}/${file}`, code);
    });
  });

program
  .command('convert')
  .description('convert external API specs to json2http config files')
  .addOption(
    new Option('-t, --type <type>', 'specify the source spec format').choices(['openapi@3']).default('openapi@3'),
  )
  .option(
    '-s, --search <search>',
    'specify the search directory (default is current directory) for source spec files.',
    '.',
  )
  .option('-o, --output <output>', 'output directory for json2http config files (defaults to the search directory)')
  .action(options => {
    const search = Path.resolve(options.search).replace(/\\/g, '/');
    bin.dirIsExist(search);

    const output = Path.resolve(options.output || search).replace(/\\/g, '/');
    bin.dirIsExist(output);

    bin.searchJsons(search).forEach((jsons, file) => {
      if (!jsons['openapi'] || !jsons['info'] || !jsons['paths']) {
        return;
      }
      const out = `${output}${file}.${options.type}.json`;
      Fs.writeFileSync(
        out,
        new Base.OpenApi(
          jsons,
          true,
          Fs.existsSync(out) ? Base.OpenApi.history(JSON.parse(Fs.readFileSync(out).toString())) : undefined,
        ).parse(),
      );
    });
  });

program.parseAsync().catch(e => bin.exit(e));
