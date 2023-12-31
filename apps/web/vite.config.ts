import { Palette, createTheme } from '@mui/material/styles';
import react from '@vitejs/plugin-react-swc';
import { pipe } from 'fp-ts/lib/function';
import fs from 'fs';
import hexRgb from 'hex-rgb';
import { map, toPairs, transpose } from 'ramda';
import replace from 'replace-in-file';
import { defineConfig } from 'vite';
import EnvironmentPlugin from 'vite-plugin-environment';
import tsconfigPaths from 'vite-tsconfig-paths';

import {
  DOWN_COLOR,
  DOWN_COLOR_DARK,
  PRIMARY_COLOR,
  SECONDARY_COLOR,
  UP_COLOR,
  UP_COLOR_DARK,
} from './src/styles/theme.constant';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  if (mode !== 'test') replaceColorCssVariables();
  else console.log('Skipped replace color CSS variables');

  return {
    envDir: 'env',
    server: { watch: { ignored: ['**/src/**/*.{itest,test}.ts?(x)'] } },
    plugins: [react(), tsconfigPaths(), EnvironmentPlugin('all')],
    define: {
      VITE_API_BASE_URL: process.env.VITE_API_BASE_URL,
    },
  };
});

function replaceColorCssVariables() {
  const filesList = [
    {
      templatePath: './src/styles/css/colorToken.template.css',
      outputPath: './src/styles/css/colorToken.css',
    },
    {
      templatePath: './src/styles/css/toastColor.template.css',
      outputPath: './src/styles/css/toastColor.css',
    },
  ];
  const lightThemePrefix = 'LT_';
  const darkThemePrefix = 'DT_';
  const paletteOptions = { primary: { main: PRIMARY_COLOR }, secondary: { main: SECONDARY_COLOR } };

  console.log('Replacing color CSS variables start');

  const { palette: lightPalette } = createTheme({ palette: { mode: 'light', ...paletteOptions } });
  const { palette: darkPalette } = createTheme({ palette: { mode: 'dark', ...paletteOptions } });

  const lightColorTemplateMapping = generateColorMapping(lightPalette, lightThemePrefix);
  const darkColorTemplateMapping = generateColorMapping(darkPalette, darkThemePrefix);
  const [from, to] = transpose([
    [new RegExp(`'%${lightThemePrefix}UP_COLOR%'`, 'g'), transformColorToRgb(UP_COLOR)],
    [new RegExp(`'%${darkThemePrefix}UP_COLOR%'`, 'g'), transformColorToRgb(UP_COLOR_DARK)],
    [new RegExp(`'%${lightThemePrefix}DOWN_COLOR%'`, 'g'), transformColorToRgb(DOWN_COLOR)],
    [new RegExp(`'%${darkThemePrefix}DOWN_COLOR%'`, 'g'), transformColorToRgb(DOWN_COLOR_DARK)],
  ]) as [RegExp[], string[]];

  filesList.forEach(({ templatePath, outputPath }) => {
    copyColorTemplate(templatePath, outputPath);
    const replaceResult = replace.sync({
      files: outputPath,
      from: [...lightColorTemplateMapping.from, ...darkColorTemplateMapping.from, ...from],
      to: [...lightColorTemplateMapping.to, ...darkColorTemplateMapping.to, ...to],
    });
    console.log('>>>> ', replaceResult);
  });

  console.log('Replacing color CSS variables done');
}

function copyColorTemplate(templatePath: string, outputPath: string) {
  try {
    fs.copyFileSync(templatePath, outputPath);
    console.log(`${templatePath} was copied to ${outputPath}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Copying ${templatePath} failed: ${error.message}`);
      throw error;
    } else {
      console.error(`Copying ${templatePath} failed: ${JSON.stringify(error)}`);
    }
  }
}

function generateColorMapping(palette: Palette, prefix: string) {
  const mapper = {
    PRIMARY: palette.primary.main,
    PRIMARY_LIGHT: palette.primary.light,
    PRIMARY_DARK: palette.primary.dark,
    SECONDARY: palette.secondary.main,
    SECONDARY_LIGHT: palette.secondary.light,
    SECONDARY_DARK: palette.secondary.dark,
    SUCCESS: palette.success.main,
    SUCCESS_LIGHT: palette.success.light,
    SUCCESS_DARK: palette.success.dark,
    INFO: palette.info.main,
    INFO_LIGHT: palette.info.light,
    INFO_DARK: palette.info.dark,
    WARN: palette.warning.main,
    WARN_LIGHT: palette.warning.light,
    WARN_DARK: palette.warning.dark,
    ERROR: palette.error.main,
    ERROR_LIGHT: palette.error.light,
    ERROR_DARK: palette.error.dark,
    TEXT: palette.text.primary,
    TEXT_SECONDARY: palette.text.secondary,
    TEXT_DISABLE: palette.text.disabled,
    TEXT_ON_PRIMARY: palette.primary.contrastText,
    TEXT_ON_SECONDARY: palette.secondary.contrastText,
    TEXT_ON_SUCCESS: palette.success.contrastText,
    TEXT_ON_INFO: palette.info.contrastText,
    TEXT_ON_WARN: palette.warning.contrastText,
    TEXT_ON_ERROR: palette.error.contrastText,
    OUTLINE: palette.divider,
    BG: palette.background.default,
    SURFACE: palette.background.paper,
  };

  const [from, to] = pipe(
    toPairs(mapper),
    map(([key, value]) => [new RegExp(`'%${prefix}${key}%'`, 'g'), transformColorToRgb(value)]),
    transpose,
  ) as [RegExp[], string[]];

  return { from, to };
}

function transformColorToRgb(color: string) {
  if (color.trim().startsWith('#')) {
    const { red, green, blue } = hexRgb(color);
    return `${red}, ${green}, ${blue}`;
  } else if (color.trim().startsWith('rgb(')) {
    const result = color.trim().match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\s*\)$/);
    if (result && result.length === 4) return `${result[1]}, ${result[2]}, ${result[3]}`;
  }
  return color;
}
