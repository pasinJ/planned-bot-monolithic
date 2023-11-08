import { BtExecutionId } from '#features/btStrategies/btExecution';
import { BtStrategyId } from '#features/btStrategies/btStrategy';
import { BACKTEST_REPORT_ROUTE, BACKTEST_STRATEGY_ROUTE, BT_MAIN_ROUTE } from '#routes/routes.constant';

import NavLinkBase from './NavLinkBase';

export const BacktestMainPageLink = NavLinkBase({ to: BT_MAIN_ROUTE, label: 'backtesting page' });
export const BacktestStrategyPageLink = (btStrategyId?: BtStrategyId) => {
  return NavLinkBase({
    to: btStrategyId
      ? BACKTEST_STRATEGY_ROUTE.replace(':btStrategyId', btStrategyId)
      : BACKTEST_STRATEGY_ROUTE.replace('/:btStrategyId', ''),
    label: 'go to create backtesting strategy page',
  });
};
export const BacktestReportPageLink = (btStrategyId: BtStrategyId, btExecutionId: BtExecutionId) => {
  return NavLinkBase({
    to: BACKTEST_REPORT_ROUTE.replace(':btStrategyId', btStrategyId).replace(':btExecutionId', btExecutionId),
    label: 'go to backtesting execution result page',
  });
};
