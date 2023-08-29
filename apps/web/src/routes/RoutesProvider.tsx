import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import MainLayout from 'src/layouts/MainLayout';

import LazyWrapper from '#components/LazyWrapper';

import { BACKTESTING_CREATE_ROUTE, BACKTESTING_ROUTE, DASHBOARD_ROUTE, HOME_ROUTE } from './routes.constant';

const HomePage = () => import('#pages/HomePage');
const DashboardPage = () => import('#pages/DashboardPage');
const BacktestingPage = () => import('#features/backtesting-strategies/pages/BacktestingPage');
const BacktestingCreatePage = () => import('#features/backtesting-strategies/pages/BacktestingCreatePage');

const router = createBrowserRouter([
  {
    path: HOME_ROUTE,
    element: <MainLayout />,
    children: [
      { path: HOME_ROUTE, element: <LazyWrapper component={HomePage} /> },
      { path: DASHBOARD_ROUTE, element: <LazyWrapper component={DashboardPage} /> },
      { path: BACKTESTING_ROUTE, element: <LazyWrapper component={BacktestingPage} /> },
      { path: BACKTESTING_CREATE_ROUTE, element: <LazyWrapper component={BacktestingCreatePage} /> },
    ],
  },
  { path: '*', element: 'empty' },
]);

export default function RoutesProvider() {
  return <RouterProvider router={router} />;
}
