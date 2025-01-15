import { Option, program } from 'commander';
import Path from 'path';
import Fs from 'fs';
import { Json2httpBin } from './bin';
import { Json2HttpBase } from '.';

const description = [
  'generate http request function based on JSON configuration',
  `currently supported languages: ${Object.values(Json2HttpBase.Language)}`,
].join('\n');

program.description(description).version('0.0.1', '-v --version', 'current version');

program
  .description(description)
  .command('build')
  .addOption(
    new Option('-l, --language <language>', 'specify the language for generating code')
      .choices(Object.values(Json2HttpBase.Language))
      .makeOptionMandatory(),
  )
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
  .option(
    '-e, --defaultExecutor <defaultExecutor>',
    [
      'to facilitate usage, built-in executors for different languages have been provided',
      `you can specify one for your runtime environment, there are [${Object.values(Json2HttpBase.DefaultExecutor)}]`,
    ].join('\n'),
  )
  .action(async options => {
    const { bin } = Json2httpBin;
    const { func, DefaultExecutor, Language } = Json2HttpBase;

    const workspace = Path.resolve(options.workspace);
    bin.dirIsExist(workspace);

    const output = Path.resolve(options.output || workspace);
    bin.dirIsExist(output);

    const { desc } = func.language(func.envJson2http.language);

    const extend =
      options.extend === ''
        ? ''
        : Path.resolve(
            options.extend === undefined ? `${output}/extend.${func.language(options.language).ext}` : options.extend,
          );
    if (extend) {
      try {
        bin.fileIsExit(extend);
      } catch (e) {
        if (options.extend === undefined) {
          Fs.writeFileSync(extend, Fs.readFileSync(Path.resolve(__dirname, `../src/${desc}/extend`)));
        } else {
          throw e;
        }
      }
    }

    func.envJson2http.language = func.envJson2class.language = options.language;
    func.envJson2http.output = output;
    func.envJson2http.extend = bin.parseExtend(output, extend);
    let defaultExecutor = options.defaultExecutor;
    if (!defaultExecutor) {
      switch (func.envJson2http.language) {
        case Language.Dart3:
          defaultExecutor = DefaultExecutor.Dart_Dio5;
          break;
        // case Language.ArkTs5:
        //   defaultExecutor = DefaultExecutor.ArkTs_Http5;
        //   break;
      }
    }
    if (!defaultExecutor.startsWith(`${desc}_`)) {
      func.assertError(
        `the set language(${func.envJson2http.language}) does not match the executor(${defaultExecutor})`,
      );
    }
    func.envJson2http.defaultExecutor = defaultExecutor;

    bin.http2file(bin.json2piece(workspace)).forEach((code, file) => {
      Fs.writeFileSync(`${output}/${file}`, code);
    });
  });

program.parseAsync().catch(e => Json2httpBin.bin.exit(e));
