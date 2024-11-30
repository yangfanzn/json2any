import { program } from 'commander';
import Path from 'path';
import Fs from 'fs';
import Ajv from 'ajv';
import { bin } from 'json2class';
import { Supported, tools, schemaJson, SchemaTs } from './index';

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
    bin.isSupported(type, Object.values(Supported));

    // todo: 同 json2class
    const cache = Path.resolve('.');
    // Shelljs.rm('-rf', cache);
    // Shelljs.mkdir('-p', cache);

    function json2piece() {
      const ajv = new Ajv();
      return Array.from(bin.searchJsons(Path.resolve('.'))).reduce((codes, [_, jsons]) => {
        Object.keys(jsons).forEach(key => {
          const json = jsons[key];
          const validate = ajv.compile(schemaJson);
          if (!validate(json)) {
            const [error] = validate.errors ?? [];
            bin.exit([`${key}:${error.instancePath}`, ...(validate.errors?.map(e => e.message) ?? [])].join('\n'));
          }
          if (codes.has(key)) {
            bin.exit(`${key} already exists`);
          }
          // schema 验证通过，这里的 http 就满足 SchemaTs
          codes.set(key, json);
        });
        return codes;
      }, new Map<string, SchemaTs>());
    }

    tools(type)
      .toFiles(json2piece(), type)
      .forEach((code, file) => {
        Fs.writeFileSync(`${cache}/${file}`, code);
      });
  });

program.parse();
