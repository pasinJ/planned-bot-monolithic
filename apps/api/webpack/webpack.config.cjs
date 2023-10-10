const path = require('node:path');

module.exports = {
  mode: 'production',
  target: 'node',
  entry: { ramda: 'ramda' },
  output: {
    filename: '[name].cjs',
    library: '[name]',
    path: path.resolve(__dirname, '../src/libs'),
    clean: true,
  },
};
