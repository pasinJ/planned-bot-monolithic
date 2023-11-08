const scanner = require('sonarqube-scanner');

scanner(
  {
    serverUrl: 'http://localhost:9000',
    token: 'xxx',
    options: {
      'sonar.projectName': 'web-frontend',
      'sonar.projectDescription': '',
      'sonar.projectKey': 'web-frontend',
      'sonar.sources': 'src',
      'sonar.tests': 'src',
      'sonar.test.inclusions': 'src/**/*.test.tsx,src/**/*.test.ts,src/**/*.itest.ts',
      'sonar.sourceEncoding': 'UTF-8',
    },
  },
  () => process.exit(),
);
