import { createTheme } from '@mui/material/styles';
import { mergeAll } from 'ramda';
import type { Config } from 'tailwindcss';

import * as breakpoints from './src/styles/theme.constant.ts';

const muiTheme = createTheme();

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  important: '#root',
  darkMode: 'class',
  corePlugins: { preflight: false },
  theme: {
    screens: {
      sm: breakpoints.SM_SCREEN + 'px',
      md: breakpoints.MD_SCREEN + 'px',
      lg: breakpoints.LG_SCREEN + 'px',
    },
    colors: ({ colors }) => ({
      transparent: colors.transparent,
      white: colors.white,
      black: colors.black,
      gray: colors.gray,
      primary: {
        DEFAULT: `var(--primary-color)`,
        light: `var(--primary-light-color)`,
        dark: `var(--primary-dark-color)`,
      },
      secondary: {
        DEFAULT: `var(--secondary-color)`,
        light: `var(--secondary-light-color)`,
        dark: `var(--secondary-dark-color)`,
      },
      success: {
        DEFAULT: `var(--success-color)`,
        light: `var(--success-light-color)`,
        dark: `var(--success-dark-color)`,
      },
      info: {
        DEFAULT: `var(--info-color)`,
        light: `var(--info-light-color)`,
        dark: `var(--info-dark-color)`,
      },
      warn: {
        DEFAULT: `var(--warn-color)`,
        light: `var(--warn-light-color)`,
        dark: `var(--warn-dark-color)`,
      },
      error: {
        DEFAULT: `var(--error-color)`,
        light: `var(--error-light-color)`,
        dark: `var(--error-dark-color)`,
      },
      textColor: {
        DEFAULT: `var(--text-color)`,
        secondary: `var(--text-secondary-color)`,
        disabled: `var(--text-disabled-color)`,
        onPrimary: `var(--text-on-primary-color)`,
        onSecondary: `var(--text-on-secondary-color)`,
        onSuccess: `var(--text-on-success-color)`,
        onInfo: `var(--text-on-info-color)`,
        onWarn: `var(--text-on-warn-color)`,
        onError: `var(--text-on-error-color)`,
      },
      outline: `var(--outline-color)`,
      background: `var(--background-color)`,
      surface: `var(--surface-color)`,
    }),
    extend: {
      boxShadow: { ...mergeAll(muiTheme.shadows.map((v, i) => ({ [i.toString()]: v }))) },
      content: { empty: '""', lightModeSym: '"\\E518"', darkModeSym: '"\\E51C"' },
      fontFamily: { materialSymbols: ['Material Symbols Rounded'] },
    },
  },
  plugins: [],
} satisfies Config;
