# Note
- Error "Parsing error: ESLint was configured to run on `<tsconfigRootDir>/src/styles/theme.constant.ts` using `parserOptions.project`" when include `theme.constant.ts` info `tsconfig.node.json`
   - **Solution**
     - Remove `"references": [{ "path": "./tsconfig.node.json" }]` from `tsconfig.json`