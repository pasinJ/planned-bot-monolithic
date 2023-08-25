import { defineConfig } from 'cypress';
import vitePreprocessor from 'cypress-vite';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    blockHosts: ['*fonts.googleapis.com'],
    setupNodeEvents(on) {
      on('file:preprocessor', vitePreprocessor());
    },
  },
});
