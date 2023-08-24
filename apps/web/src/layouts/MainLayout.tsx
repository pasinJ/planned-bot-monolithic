import { Outlet } from 'react-router-dom';

import MainLayoutLg from './MainLayoutLg';

export default function MainLayout() {
  return (
    <MainLayoutLg>
      <Outlet />
    </MainLayoutLg>
  );
}
