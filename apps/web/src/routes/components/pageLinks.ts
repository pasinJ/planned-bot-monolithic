import { BACKTEST_ROUTE } from '#routes/routes.constant';

import NavLinkBase from './NavLinkBase';

export const BacktestingPageLink = NavLinkBase({ to: BACKTEST_ROUTE, 'aria-label': 'backtesting page' });
