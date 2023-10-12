const path = require('node:path');
const tsconfig = require('../tsconfig.json');

module.exports = {
  mode: 'production',
  target: 'node',
  entry: { lodash: 'lodash', _ta: './src/features/shared/strategyExecutorModules/technicalAnalysis.ts' },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules\/(?!@ixjb94\/indicators).*/,
        use: {
          loader: 'swc-loader',
          options: {
            jsc: {
              parser: { syntax: 'typescript' },
              baseUrl: path.resolve(tsconfig.compilerOptions.baseUrl),
              paths: tsconfig.compilerOptions.paths,
            },
            minify: true,
          },
        },
      },
    ],
  },
  resolve: { extensions: ['.ts', '.js', '.json'], extensionAlias: { '.js': ['.ts', '.js'] } },
  output: {
    filename: '[name].cjs',
    library: '[name]',
    path: path.resolve(__dirname, '../src/libs'),
    clean: true,
  },
};
