import { ADD_BT_STRATEGY_ROUTE, BT_MAIN_ROUTE } from '#routes/routes.constant';

import NavLinkBase from './NavLinkBase';

export const BtMainPageLink = NavLinkBase({ to: BT_MAIN_ROUTE, label: 'backtesting page' });
export const AddBtStrategyPageLink = NavLinkBase({
  to: ADD_BT_STRATEGY_ROUTE,
  label: 'go to add backtesting strategy page',
});
