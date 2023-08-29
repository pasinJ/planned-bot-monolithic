import { BACKTESTING_CREATE_ROUTE, BACKTESTING_ROUTE } from '#routes/routes.constant';

import NavLinkBase from './NavLinkBase';

export const BacktestingPageLink = NavLinkBase({ to: BACKTESTING_ROUTE, 'aria-label': 'backtesting page' });
export const BacktestingCreatePageLink = NavLinkBase({
  to: BACKTESTING_CREATE_ROUTE,
  'aria-label': 'go to create backtesting strategy form',
});
