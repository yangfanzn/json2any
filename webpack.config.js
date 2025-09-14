const Path = require('path');
const Fs = require('fs');

// todo: clean-webpack-plugin & *.d.ts

/** @enum {string} */
const Type = { Json2class: 'json2class', Json2http: 'json2http' };
/** @type {Type} */
const type = Path.basename(Path.resolve('.')) || Type.Json2class;

module.exports = {
  entry: {
    bin: './bin.ts',
    [type]: './cmd.ts',
    index: './index.ts',
  },
  output: {
    path: Path.resolve('./', 'lib'),
    filename: context => (context.chunk.name === type ? type : '[name].js'),
    libraryTarget: 'commonjs2',
  },
  target: 'node',
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: new RegExp(`node_modules${type === Type.Json2http ? `|${Type.Json2class}` : ''}`),
      },
      {
        test: /\.(txt|dart|ets\.ts|kt|swift)$/,
        use: 'raw-loader',
      },
    ],
  },
  plugins: [
    {
      apply: compiler => {
        compiler.hooks.afterEmit.tapAsync('AddShebangPlugin', (compilation, callback) => {
          const cmd = Path.resolve(`./lib/${type}`);
          const content = Fs.readFileSync(cmd, 'utf8').toString();
          if (!content.startsWith('#!')) {
            Fs.writeFileSync(cmd, `#!/usr/bin/env node\n${content}`);
          }
          Fs.chmodSync(cmd, '755');

          // add license copyright
          const p = Path.resolve('./LICENSE');
          Fs.writeFileSync(
            p,
            Fs.readFileSync(p)
              .toString()
              .replace(/^Copyright.*?$/m, `Copyright (c) 2024-present ${require('./package.json').author}, China`),
          );
          callback();
        });
      },
    },
  ],

  // devtool: 'source-map',
  mode: 'development',
  // mode: 'production',
};
