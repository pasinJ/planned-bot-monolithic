import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import MainLayout from 'src/layouts/MainLayout';

import LazyWrapper from '#components/LazyWrapper';

import { ADD_BT_STRATEGY_ROUTE, DASHBOARD_ROUTE, HOME_ROUTE, BT_MAIN_ROUTE } from './routes.constant';

const HomePage = () => import('#pages/HomePage');
const DashboardPage = () => import('#pages/DashboardPage');
const BtMainPage = () => import('#features/backtesting-strategies/pages/BtMainPage');
const AddBtStrategyPage = () => import('#features/backtesting-strategies/pages/AddBtStrategyPage');

const router = createBrowserRouter([
  {
    path: HOME_ROUTE,
    element: <MainLayout />,
    children: [
      { path: HOME_ROUTE, element: <LazyWrapper component={HomePage} /> },
      { path: DASHBOARD_ROUTE, element: <LazyWrapper component={DashboardPage} /> },
      { path: BT_MAIN_ROUTE, element: <LazyWrapper component={BtMainPage} /> },
      { path: ADD_BT_STRATEGY_ROUTE, element: <LazyWrapper component={AddBtStrategyPage} /> },
    ],
  },
  { path: '*', element: 'empty' },
]);

export default function RoutesProvider() {
  return <RouterProvider router={router} />;
}
