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
      hoverable: { raw: '(hover: hover)' },
    },
    colors: ({ colors }) => ({
      inherit: 'inherit',
      transparent: colors.transparent,
      white: colors.white,
      black: colors.black,
      gray: colors.gray,
      slate: colors.slate,
      primary: {
        DEFAULT: 'rgba(var(--primary-color), <alpha-value>)',
        light: 'rgba(var(--primary-light-color), <alpha-value>)',
        dark: 'rgba(var(--primary-dark-color), <alpha-value>)',
      },
      secondary: {
        DEFAULT: 'rgba(var(--secondary-color), <alpha-value>)',
        light: 'rgba(var(--secondary-light-color), <alpha-value>)',
        dark: 'rgba(var(--secondary-dark-color), <alpha-value>)',
      },
      success: {
        DEFAULT: 'rgba(var(--success-color), <alpha-value>)',
        light: 'rgba(var(--success-light-color), <alpha-value>)',
        dark: 'rgba(var(--success-dark-color), <alpha-value>)',
      },
      info: {
        DEFAULT: 'rgba(var(--info-color), <alpha-value>)',
        light: 'rgba(var(--info-light-color), <alpha-value>)',
        dark: 'rgba(var(--info-dark-color), <alpha-value>)',
      },
      warn: {
        DEFAULT: 'rgba(var(--warn-color), <alpha-value>)',
        light: 'rgba(var(--warn-light-color), <alpha-value>)',
        dark: 'rgba(var(--warn-dark-color), <alpha-value>)',
      },
      error: {
        DEFAULT: 'rgba(var(--error-color), <alpha-value>)',
        light: 'rgba(var(--error-light-color), <alpha-value>)',
        dark: 'rgba(var(--error-dark-color), <alpha-value>)',
      },
      textColor: {
        DEFAULT: 'var(--text-color)',
        secondary: 'var(--text-secondary-color)',
        disabled: 'var(--text-disabled-color)',
        onPrimary: 'var(--text-on-primary-color)',
        onSecondary: 'var(--text-on-secondary-color)',
        onSuccess: 'var(--text-on-success-color)',
        onInfo: 'var(--text-on-info-color)',
        onWarn: 'var(--text-on-warn-color)',
        onError: 'var(--text-on-error-color)',
      },
      outline: 'var(--outline-color)',
      background: 'rgba(var(--background-color), <alpha-value>)',
      surface: {
        DEFAULT: 'color-mix(in srgb, rgb(var(--primary-color)) 2%, rgb(var(--background-color)))',
        1: 'color-mix(in srgb, rgb(var(--primary-color)) 5%, rgb(var(--background-color)))',
        2: 'color-mix(in srgb, rgb(var(--primary-color)) 8%, rgb(var(--background-color)))',
        3: 'color-mix(in srgb, rgb(var(--primary-color)) 11%, rgb(var(--background-color)))',
        4: 'color-mix(in srgb, rgb(var(--primary-color)) 12%, rgb(var(--background-color)))',
        5: 'color-mix(in srgb, rgb(var(--primary-color)) 14%, rgb(var(--background-color)))',
      },
    }),
    extend: {
      boxShadow: { ...mergeAll(muiTheme.shadows.map((v, i) => ({ [i.toString()]: v }))) },
      content: { empty: '""', lightModeSym: '"\\E518"', darkModeSym: '"\\E51C"' },
      fontFamily: { materialSymbols: ['Material Symbols Rounded'] },
      transitionProperty: { width: 'width' },
      transitionDuration: { muiEnter: '225', muiLeave: '195' },
      transitionTimingFunction: { sharp: 'cubic-bezier(0.4, 0, 0.6, 1)' },
    },
  },
  plugins: [],
} satisfies Config;
