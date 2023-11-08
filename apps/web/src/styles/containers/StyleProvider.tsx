import CssBaseline from '@mui/material/CssBaseline';
import {
  StyledEngineProvider,
  ThemeOptions,
  ThemeProvider,
  createTheme,
  responsiveFontSizes,
} from '@mui/material/styles';
import 'material-symbols/rounded.css';
import { assocPath } from 'ramda';
import { PropsWithChildren, useLayoutEffect } from 'react';

import '../css/index.css';
import useAppTheme from '../hooks/useAppTheme';
import { LG_SCREEN_BP, MD_SCREEN_BP, PRIMARY_COLOR, SECONDARY_COLOR, SM_SCREEN_BP } from '../theme.constant';
import { themeEnum } from '../theme.type';

declare module '@mui/material/styles' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface BreakpointOverrides {
    xs: true;
    sm: true;
    md: true;
    lg: true;
    xl: false;
    mobile: false;
    tablet: false;
    laptop: false;
    desktop: false;
  }
}

export default function StyleProvider({ children, rootElem }: PropsWithChildren<{ rootElem: HTMLElement }>) {
  const { appTheme } = useAppTheme();

  // https://mui.com/material-ui/guides/interoperability/#tailwind-css
  const muiThemeOptions: ThemeOptions = {
    breakpoints: { values: { xs: 0, sm: SM_SCREEN_BP, md: MD_SCREEN_BP, lg: LG_SCREEN_BP } },
    palette: { primary: { main: PRIMARY_COLOR }, secondary: { main: SECONDARY_COLOR } },
    components: {
      MuiPopover: { defaultProps: { container: rootElem } },
      MuiPopper: { defaultProps: { container: rootElem } },
      MuiDialog: { defaultProps: { container: rootElem } },
      MuiModal: { defaultProps: { container: rootElem } },
    },
  };
  const muiTheme = responsiveFontSizes(
    createTheme(assocPath(['palette', 'mode'], appTheme, muiThemeOptions)),
  );

  useLayoutEffect(() => {
    if (appTheme === themeEnum.dark) document.body.classList.add('dark');
    else document.body.classList.remove('dark');
  }, [appTheme]);

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
