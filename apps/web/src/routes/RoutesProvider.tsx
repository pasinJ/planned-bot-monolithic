import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import LazyWrapper from '#components/LazyWrapper';
import MainLayout from '#layouts/MainLayout';

import { BACKTEST_STRATEGY_ROUTE, BT_MAIN_ROUTE, DASHBOARD_ROUTE, HOME_ROUTE } from './routes.constant';

const HomePage = () => import('#pages/HomePage');
const DashboardPage = () => import('#pages/DashboardPage');
const BtMainPage = () => import('#pages/BtMainPage');
const BacktestStrategyPage = () => import('#pages/BacktestStrategyPage');

const router = createBrowserRouter([
  {
    path: HOME_ROUTE,
    element: <MainLayout />,
    children: [
      { path: HOME_ROUTE, element: <LazyWrapper component={HomePage} /> },
      { path: DASHBOARD_ROUTE, element: <LazyWrapper component={DashboardPage} /> },
      { path: BT_MAIN_ROUTE, element: <LazyWrapper component={BtMainPage} /> },
      { path: BACKTEST_STRATEGY_ROUTE, element: <LazyWrapper component={BacktestStrategyPage} /> },
    ],
  },
  { path: '*', element: 'empty' },
]);

export default function RoutesProvider() {
  return <RouterProvider router={router} />;
}
