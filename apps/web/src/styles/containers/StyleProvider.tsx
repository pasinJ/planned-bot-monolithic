import CssBaseline from '@mui/material/CssBaseline';
import { StyledEngineProvider, ThemeOptions, ThemeProvider, createTheme } from '@mui/material/styles';
import 'material-symbols/rounded.css';
import { assocPath } from 'ramda';
import { PropsWithChildren, useLayoutEffect } from 'react';

import '../css/index.css';
import useAppTheme from '../hooks/useAppTheme';
import { PRIMARY, SECONDARY } from '../theme.constant';
import { themeEnum } from '../theme.schema';

export default function StyleProvider({ children, rootElem }: PropsWithChildren<{ rootElem: HTMLElement }>) {
  const { appTheme } = useAppTheme();

  // https://mui.com/material-ui/guides/interoperability/#tailwind-css
  const muiThemeOptions: ThemeOptions = {
    palette: { primary: { main: PRIMARY }, secondary: { main: SECONDARY } },
    components: {
      MuiPopover: { defaultProps: { container: rootElem } },
      MuiPopper: { defaultProps: { container: rootElem } },
      MuiDialog: { defaultProps: { container: rootElem } },
      MuiModal: { defaultProps: { container: rootElem } },
    },
  };
  const muiTheme = createTheme(assocPath(['palette', 'mode'], appTheme, muiThemeOptions));

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
