const path = require('path');

// todo: clean-webpack-plugin & *.d.ts

module.exports = {
  entry: './index.ts',
  output: {
    path: path.resolve('./', 'lib'),
    filename: './index.js',
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
  // devtool: 'source-map',
  // mode: 'development',
  mode: 'production',
};
