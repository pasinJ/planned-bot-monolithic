import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { Divider } from '@mui/material';
import Button from '@mui/material/Button';
import Tab from '@mui/material/Tab';
import { toPairs } from 'ramda';
import { useEffect, useState } from 'react';
import { P, match } from 'ts-pattern';

import { BtExecutionId, isExecutionInFinalStatus } from '#features/btStrategies/btExecution';
import { AssetCurrency, BtRange, CapitalCurrency, InitialCapital } from '#features/btStrategies/btStrategy';
import useExecutionProgress from '#features/btStrategies/hooks/useExecutionProgress';
import useExecutionResult from '#features/btStrategies/hooks/useExecutionResult';
import { Kline } from '#features/klines/kline';
import useAutoFetch from '#hooks/useAutoFetch';
import { BacktestMainPageLink } from '#routes/components/pageLinks';
import { isUndefined } from '#shared/utils/typeGuards';

import LogsPanel, { LogsPanelProps } from './LogsPanel';
import OrdersPanel, { OrdersPanelProps } from './OrdersPanel';
import PerformancePanel, { PerformancePanelProps } from './PerformancePanel';
import TradesPanel, { TradesPanelProps } from './TradesPanel';

type TabValue = keyof typeof tabMap;
const tabMap = {
  logs: { label: 'Logs', panelComponent: (props: LogsPanelProps) => <LogsPanel {...props} /> },
  performance: {
    label: 'Performance report',
    panelComponent: (props: PerformancePanelProps) => <PerformancePanel {...props} />,
  },
  trades: { label: 'Trades list', panelComponent: (props: TradesPanelProps) => <TradesPanel {...props} /> },
  orders: { label: 'Orders list', panelComponent: (props: OrdersPanelProps) => <OrdersPanel {...props} /> },
};

type BacktestingResultTabProps = {
  btExecutionId: BtExecutionId;
  klines: readonly Kline[];
  initialCapital: InitialCapital;
  capitalCurrency: CapitalCurrency;
  assetCurrency: AssetCurrency;
  btRange: BtRange;
  moveToPrevTab: () => void;
};
export default function BacktestingResultTab(props: BacktestingResultTabProps) {
  const { btExecutionId, klines, initialCapital, capitalCurrency, assetCurrency, btRange, moveToPrevTab } =
    props;

  const [activeTab, setActiveTab] = useState<TabValue>('logs');
  const handleChangeTab = (_: unknown, tabValue: TabValue) => setActiveTab(tabValue);

  const fetchProgress = useExecutionProgress(btExecutionId);
  const [fetchResult, handleStartFetchResult] = useAutoFetch(false, useExecutionResult, [btExecutionId]);

  useEffect(() => {
    const isExecutionFinal = fetchProgress.data ? isExecutionInFinalStatus(fetchProgress.data) : false;
    if (isExecutionFinal && !fetchResult.isFetched) handleStartFetchResult();
  }, [fetchProgress.data, fetchResult.isFetched, handleStartFetchResult]);

  return (
    <div className="flex w-full flex-col rounded-xl bg-background shadow-2 lg:mt-6">
      <TabContext value={activeTab}>
        <TabList onChange={handleChangeTab} variant="fullWidth" className="overflow-x-auto" centered>
          {toPairs(tabMap).map(([key, val]) => (
            <Tab
              key={key}
              label={val.label}
              value={key}
              className="py-6"
              disabled={key !== 'logs' && fetchProgress.data && fetchProgress.data.status !== 'FINISHED'}
            />
          ))}
        </TabList>
        {toPairs(tabMap).map((pair) => (
          <TabPanel key={pair[0]} value={pair[0]}>
            {match(pair)
              .with(['logs', P.any], ([, val]) =>
                val.panelComponent({
                  progress: fetchProgress.data,
                  executionTimeMs: fetchResult.data?.executionTimeMs,
                }),
              )
              .with(['performance', P.any], ([, val]) =>
                isUndefined(fetchResult.data)
                  ? undefined
                  : val.panelComponent({
                      klines,
                      filledOrders: fetchResult.data.orders.filledOrders,
                      trades: fetchResult.data.trades,
                      performance: fetchResult.data.performance,
                      initialCapital,
                      capitalCurrency,
                      assetCurrency,
                      btRange,
                    }),
              )
              .with(['trades', P.any], ([, val]) =>
                isUndefined(fetchResult.data)
                  ? undefined
                  : val.panelComponent({ trades: fetchResult.data.trades, capitalCurrency }),
              )
              .with(['orders', P.any], ([, val]) =>
                isUndefined(fetchResult.data)
                  ? undefined
                  : val.panelComponent({ orders: fetchResult.data.orders, klines }),
              )
              .exhaustive()}
          </TabPanel>
        ))}
      </TabContext>
      <Divider variant="middle" />
      <div className="flex justify-between px-6 py-4">
        <Button variant="outlined" onClick={moveToPrevTab}>
          Back
        </Button>
        <Button variant="contained" component={BacktestMainPageLink}>
          Done
        </Button>
      </div>
    </div>
  );
}
