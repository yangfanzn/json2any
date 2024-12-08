const path = require('path');
const fs = require('fs');

// todo: clean-webpack-plugin & *.d.ts

module.exports = {
  entry: {
    bin: './bin.ts',
    cmd: './cmd.ts',
    index: './index.ts',
  },
  output: {
    path: path.resolve('./', 'lib'),
    filename: '[name].js',
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
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    {
      apply: compiler => {
        compiler.hooks.afterEmit.tapAsync('AddShebangPlugin', (compilation, callback) => {
          const bin = path.resolve('./lib/cmd.js');
          const content = fs.readFileSync(bin, 'utf8').toString();
          if (!content.startsWith('#!')) {
            fs.writeFileSync(bin, `#!/usr/bin/env node\n${content}`);
          }
          fs.chmodSync(bin, '755');
          callback();
        });
      },
    },
  ],

  // devtool: 'source-map',
  mode: 'development',
  // mode: 'production',
};
