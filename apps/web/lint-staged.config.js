import { ESLint } from 'eslint';

const removeIgnoredFiles = async (files) => {
  const eslint = new ESLint();
  const isIgnored = await Promise.all(
    files.map((file) => {
      return eslint.isPathIgnored(file);
    }),
  );
  const filteredFiles = files.filter((_, i) => !isIgnored[i]);
  return filteredFiles.join(' ');
};

export default {
  '*.{json,md}': 'npm run prettier:git',
  '*.{ts,tsx}': async (files) => {
    const filesToLint = await removeIgnoredFiles(files);
    return [`npm run lint:git ${filesToLint}`, `npm run prettier:git ${filesToLint}`];
  },
};
