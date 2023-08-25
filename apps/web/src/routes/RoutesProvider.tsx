import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import MainLayout from 'src/layouts/MainLayout';

import LazyWrapper from '#components/LazyWrapper';

import { BACKTEST_ROUTE, DASHBOARD_ROUTE, HOME_ROUTE } from './routes.constant';

const HomePage = () => import('#pages/HomePage');
const DashboardPage = () => import('#pages/DashboardPage');
const BacktestPage = () => import('#pages/BacktestingPage');

const router = createBrowserRouter([
  {
    path: HOME_ROUTE,
    element: <MainLayout />,
    children: [
      { path: HOME_ROUTE, element: <LazyWrapper component={HomePage} /> },
      { path: DASHBOARD_ROUTE, element: <LazyWrapper component={DashboardPage} /> },
      { path: BACKTEST_ROUTE, element: <LazyWrapper component={BacktestPage} /> },
    ],
  },
  { path: '*', element: 'empty' },
]);

export default function RoutesProvider() {
  return <RouterProvider router={router} />;
}
