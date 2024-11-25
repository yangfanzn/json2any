import { program } from 'commander';
import Path from 'path';
import Fs from 'fs';
import Shelljs from 'shelljs';
import Json2class, { bin } from 'json2class';
import Ajv from 'ajv';
import Schema from './schema.json';
import { supported, tools } from './index';

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
    bin.isSupported(type, supported);
    const cache = Path.resolve('./json2http');
    // Shelljs.rm('-rf', cache);
    Shelljs.mkdir('-p', cache);

    const ajv = new Ajv();
    tools(type)
      .toFiles(
        Array.from(bin.searchJsons(Path.resolve('.'))).reduce((codes, [_, json]) => {
          Object.keys(json).forEach(key => {
            const name = key.replace(/\//g, '');
            const http = json[key];
            const validate = ajv.compile(Schema);
            if (!validate(http)) {
              const [error] = validate.errors ?? [];
              bin.exit(`${key}:${error.instancePath} ${error.message}`);
            }
            if (codes.has(name)) {
              bin.exit(`${key} already exists`);
            }
            codes.set(name, http);
          });
          return codes;
        }, new Map<string, string>()),
      )
      .forEach((code, file) => {
        Fs.writeFileSync(`${cache}/${file}`, code);
      });
  });

program.parse();
