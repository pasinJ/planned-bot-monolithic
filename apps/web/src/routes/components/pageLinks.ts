import { BACKTESTING_CREATE_ROUTE, BACKTESTING_ROUTE } from '#routes/routes.constant';

import NavLinkBase from './NavLinkBase';

export const BtPageLink = NavLinkBase({ to: BACKTESTING_ROUTE, label: 'backtesting page' });
export const AddBtPageLink = NavLinkBase({
  to: BACKTESTING_CREATE_ROUTE,
  label: 'go to add backtesting strategy page',
});
