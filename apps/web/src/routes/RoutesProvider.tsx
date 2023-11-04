import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom';

import LazyWrapper from '#components/LazyWrapper';
import MainLayout from '#layouts/MainLayout';

import { BACKTEST_REPORT_ROUTE, BACKTEST_STRATEGY_ROUTE, BT_MAIN_ROUTE, HOME_ROUTE } from './routes.constant';

const BtMainPage = () => import('#pages/BtMainPage');
const BacktestStrategyPage = () => import('#pages/BacktestStrategyPage');
const BacktestReportPage = () => import('#pages/BacktestReportPage');

const router = createBrowserRouter([
  {
    path: HOME_ROUTE,
    element: <MainLayout />,
    children: [
      { path: HOME_ROUTE, element: <Navigate to={BT_MAIN_ROUTE} /> },
      { path: BT_MAIN_ROUTE, element: <LazyWrapper component={BtMainPage} /> },
      { path: BACKTEST_STRATEGY_ROUTE, element: <LazyWrapper component={BacktestStrategyPage} /> },
      { path: BACKTEST_REPORT_ROUTE, element: <LazyWrapper component={BacktestReportPage} /> },
    ],
  },
  { path: '*', element: <Navigate to={BT_MAIN_ROUTE} /> },
]);

export default function RoutesProvider() {
  return <RouterProvider router={router} />;
}
