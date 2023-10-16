module.exports = {
  files: "./dist/index.d.cts",
  from: /declare\smodule\s"\.\.\/index"/g,
  to: "declare namespace _",
};
