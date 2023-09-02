import useTheme from '@mui/material/styles/useTheme';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Outlet } from 'react-router-dom';

import MainLayoutLg from './MainLayoutLg';
import MainLayoutSm from './MainLayoutSm';

export default function MainLayout() {
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));

  if (isLargeScreen)
    return (
      <MainLayoutLg>
        <Outlet />
      </MainLayoutLg>
    );
  else
    return (
      <MainLayoutSm>
        <Outlet />
      </MainLayoutSm>
    );
}