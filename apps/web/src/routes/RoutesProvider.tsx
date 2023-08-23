import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import LazyWrapper from '#components/LazyWrapper';

import { DASHBOARD_ROUTE, HOME_ROUTE } from './routes.constant';

const HomePage = () => import('#pages/HomePage');
const DashboardPage = () => import('#pages/DashboardPage');

const router = createBrowserRouter([
  { path: HOME_ROUTE, element: <LazyWrapper component={HomePage} /> },
  { path: DASHBOARD_ROUTE, element: <LazyWrapper component={DashboardPage} /> },
  { path: '*', element: 'empty' },
]);

export default function RoutesProvider() {
  return <RouterProvider router={router} />;
}
