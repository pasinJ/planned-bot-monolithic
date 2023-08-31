const scanner = require('sonarqube-scanner');

scanner(
  {
    serverUrl: 'http://localhost:9000',
    token: 'xxx',
    options: {
      'sonar.projectName': 'backend',
      'sonar.projectDescription': '',
      'sonar.projectKey': 'backend',
      'sonar.sources': 'src',
      'sonar.tests': 'src',
      'sonar.test.inclusions': 'src/**/*.test.ts,src/**/*.itest.ts',
      'sonar.sourceEncoding': 'UTF-8',
    },
  },
  () => process.exit(),
);
