import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { DonutChart } from '@tremor/react';
import { format } from 'date-fns';
import Decimal from 'decimal.js';
import * as o from 'fp-ts/lib/Option';
import {
  ChartOptions,
  CreatePriceLineOptions,
  DeepPartial,
  LineData,
  LineSeriesOptions,
  LineStyle,
  UTCTimestamp,
} from 'lightweight-charts';
import { is, modify } from 'ramda';
import { PropsWithChildren, useMemo } from 'react';

import UpDownCard from '#components/UpDownCard';
import Chart, { useChartContainer } from '#containers/Chart';
import { dateToUtcTimestamp } from '#containers/TechnicalChart/utils';
import { AssetCurrency, BtRange, CapitalCurrency, InitialCapital } from '#features/btStrategies/btStrategy';
import { FilledOrder } from '#features/btStrategies/order';
import {
  BuyAndHoldHistory,
  EquityHistory,
  PerformanceMetrics,
  WinLossMetrics,
  createBuyAndHoldHistory,
  createEquityHistory,
} from '#features/btStrategies/performance';
import {
  ClosedTrade,
  TradesLists,
  calculatePercentageCompareWithInitialCapital,
} from '#features/btStrategies/trade';
import { Kline } from '#features/klines/kline';
import { ValidDate } from '#shared/utils/date';
import { to2Digits, to4Digits, toLocale } from '#shared/utils/number';
import { mergeClassName } from '#shared/utils/tailwind';

export type PerformancePanelProps = {
  klines: readonly Kline[];
  filledOrders: readonly FilledOrder[];
  trades: TradesLists;
  performance: PerformanceMetrics;
  initialCapital: InitialCapital;
  capitalCurrency: CapitalCurrency;
  assetCurrency: AssetCurrency;
  btRange: BtRange;
};
export default function PerformancePanel(props: PerformancePanelProps) {
  const {
    klines,
    filledOrders,
    trades,
    performance,
    capitalCurrency,
    assetCurrency,
    initialCapital,
    btRange,
  } = props;
  const { netReturn, netProfit, netLoss, maxDrawdown, maxRunup } = performance;
  const { start, end } = btRange;

  const totalNetReturnPercentage = calculatePercentageCompareWithInitialCapital(initialCapital, netReturn);
  const totalNetProfitPercentage = calculatePercentageCompareWithInitialCapital(initialCapital, netProfit);
  const totalNetLossPercentage = calculatePercentageCompareWithInitialCapital(initialCapital, netLoss);

  const equityHistory = createEquityHistory(initialCapital, filledOrders, klines);
  const buyAndHoldHistory = createBuyAndHoldHistory(initialCapital, filledOrders, klines);

  return (
    <section className="flex h-full flex-col gap-6 p-2">
      <div className="flex flex-wrap justify-evenly gap-6">
        <TradeBarChart
          className="min-w-[20rem]"
          closedTrades={trades.closedTrades}
          capitalCurrency={capitalCurrency}
        />
        <div className="flex min-w-[20rem] flex-col justify-between gap-6">
          <UpDownCard
            className="w-full max-w-sm"
            title="Total Net Return"
            value={netReturn}
            valueMaxDigits={4}
            unit={capitalCurrency}
            percentage={totalNetReturnPercentage}
          />
          <UpDownCard
            className="w-full max-w-sm"
            title="Total Net Profit"
            value={netProfit}
            valueMaxDigits={4}
            unit={capitalCurrency}
            percentage={totalNetProfitPercentage}
          />
          <UpDownCard
            className="w-full max-w-sm"
            title="Total Net Loss"
            value={netLoss}
            valueMaxDigits={4}
            unit={capitalCurrency}
            percentage={totalNetLossPercentage}
          />
        </div>
        <WinLossCard winLossMetrics={performance.winLossMetrics} capitalCurrency={capitalCurrency} />
      </div>
      <div className="flex flex-wrap justify-evenly gap-6">
        <div className="min-w-[10rem] max-w-6xl flex-grow">
          <div className="flex w-full flex-wrap justify-around gap-y-4 p-4">
            <UpDownCard
              className="flex-grow"
              title="Max. Run-up"
              value={maxRunup}
              valueMaxDigits={2}
              unit={capitalCurrency}
            />
            <UpDownCard
              className="flex-grow"
              title="Max. Drawdown"
              value={maxDrawdown}
              valueMaxDigits={2}
              unit={capitalCurrency}
            />
          </div>
          <EquityChart
            initialCapital={initialCapital}
            capitalCurrency={capitalCurrency}
            equityHistory={equityHistory}
            buyAndHoldHistory={buyAndHoldHistory}
          />
        </div>
        <EtcCard
          performance={performance}
          startTimestamp={start}
          endTimestamp={end}
          capitalCurrency={capitalCurrency}
          assetCurrency={assetCurrency}
        />
      </div>
    </section>
  );
}

type TradeBarChartProps = {
  className?: string;
  closedTrades: readonly ClosedTrade[];
  capitalCurrency: CapitalCurrency;
};
function TradeBarChart({ className, closedTrades, capitalCurrency }: TradeBarChartProps) {
  const maxAbsNetReturn = closedTrades.reduce(
    (prevMax, trade) => (Math.abs(trade.netReturn) > prevMax ? Math.abs(trade.netReturn) : prevMax),
    -Infinity,
  );
  const data = closedTrades.map((trade) => ({
    id: trade.id,
    value: trade.netReturn,
    heightPercentage: new Decimal(trade.netReturn).abs().times(100).dividedBy(maxAbsNetReturn).toNumber(),
  }));

  return (
    <div className={mergeClassName('flex flex-grow flex-col px-6', className)}>
      <Typography className="opacity-50" variant="h6" component="p">
        Net Return of Trade
      </Typography>
      <div className="h-full min-h-[8rem] w-full min-w-[8rem] p-3">
        <div className="flex h-1/2 justify-center gap-x-0.5">
          {data.map(({ id, value, heightPercentage }, index) => (
            <Tooltip
              key={index}
              title={
                <div className="flex w-fit flex-col">
                  <span>Trade ID: {id}</span>
                  <span>
                    Net return: {toLocale(value, 4)} {capitalCurrency}
                  </span>
                </div>
              }
              slotProps={{ tooltip: { className: 'text-lg max-w-none bg-gray-500' } }}
              placement={value < 0 ? 'top' : 'bottom'}
              arrow
            >
              <div
                className={`flex h-full max-w-[2rem] flex-grow ${
                  value < 0 ? 'translate-y-full' : 'items-end'
                }`}
              >
                <div
                  className={`w-full ${value < 0 ? 'bg-down' : 'bg-up'}`}
                  style={{ height: heightPercentage + '%' }}
                />
              </div>
            </Tooltip>
          ))}
        </div>
        <Divider className="bg-slate-300" variant="fullWidth" />
      </div>
    </div>
  );
}

type WinLossCardProps = { winLossMetrics: WinLossMetrics; capitalCurrency: CapitalCurrency };
function WinLossCard(props: WinLossCardProps) {
  const { winLossMetrics, capitalCurrency } = props;
  const { avgProfit, largestProfit, winRate, avgLoss, largestLoss, lossRate, numOfTotalTrades } =
    winLossMetrics;

  return (
    <MetricsCard className="min-w-[10rem] max-w-2xl flex-grow">
      <CardHeading text="Win/Loss" />
      <TradeDonutChart winLossMetrics={winLossMetrics} />
      <div className="mt-6 flex flex-wrap gap-6">
        <div className="flex w-min min-w-[16rem] flex-grow flex-col gap-y-2">
          <CardInfo title="Win Rate" info={`${winRate} %`} />
          <Divider />
          <CardInfo title="Avg. Profit" info={`${toLocale(avgProfit, 2)} ${capitalCurrency}`} />
          <Divider />
          <CardInfo title="Largest Profit" info={`${toLocale(largestProfit, 2)} ${capitalCurrency}`} />
        </div>
        <div className="flex w-min min-w-[16rem] flex-grow flex-col gap-y-2">
          <CardInfo title="Losing Rate" info={`${lossRate} %`} />
          <Divider />
          <CardInfo title="Avg. Loss" info={`${toLocale(avgLoss, 2)} ${capitalCurrency}`} />
          <Divider />
          <CardInfo title="Largest Loss" info={`${toLocale(largestLoss, 2)} ${capitalCurrency}`} />
        </div>
      </div>
      <Divider className="my-3" />
      <div className="flex justify-between">
        <Typography className="font-medium opacity-20" variant="h4" component="p">
          Total number of trades
        </Typography>
        <Typography className="font-bold" variant="h4" component="p">
          {toLocale(numOfTotalTrades)}
        </Typography>
      </div>
    </MetricsCard>
  );
}
function TradeDonutChart({ winLossMetrics }: { winLossMetrics: WinLossMetrics }) {
  const { numOfWinningTrades, winRate, numOfLosingTrades, lossRate, numOfEvenTrades, evenRate } =
    winLossMetrics;

  return (
    <DonutChart
      data={[
        { name: 'Losing trades', value: numOfLosingTrades, rate: lossRate },
        { name: 'Even trades', value: numOfEvenTrades, rate: evenRate },
        { name: 'Winning trades', value: numOfWinningTrades, rate: winRate },
      ]}
      category="value"
      index="name"
      label="# Trades"
      colors={['rose', 'gray', 'emerald']}
      customTooltip={({ payload, active }) => {
        if (!active || !payload) return null;
        const categoryPayload = (
          payload as { name: string; value: number; color: string; payload: { payload: { rate: number } } }[]
        ).at(0);
        if (!categoryPayload) return null;
        return (
          <div className="w-56 rounded-tremor-default border border-tremor-border bg-tremor-background p-2 text-tremor-default shadow-tremor-dropdown">
            <div className="flex flex-1 space-x-2.5">
              <div className={`flex w-1.5 flex-col bg-${categoryPayload.color}-500 rounded`} />
              <div className="w-full">
                <div className="flex items-center justify-between space-x-8 text-right">
                  <p className="whitespace-nowrap text-tremor-content">{categoryPayload.name}</p>
                  <span className="whitespace-nowrap font-medium text-tremor-content-emphasis">
                    <span className="opacity-50">({to2Digits(categoryPayload.payload.payload.rate)}%) </span>
                    {categoryPayload.value}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      }}
    />
  );
}

type EtcSectionProps = {
  performance: PerformanceMetrics;
  startTimestamp: ValidDate;
  endTimestamp: ValidDate;
  capitalCurrency: CapitalCurrency;
  assetCurrency: AssetCurrency;
};
function EtcCard(props: EtcSectionProps) {
  const { performance, startTimestamp, endTimestamp, capitalCurrency, assetCurrency } = props;
  const { profitFactor, returnOfInvestment, totalTradeVolume, totalFees, backtestDuration } = performance;

  return (
    <MetricsCard className="min-w-[10rem] max-w-xl">
      <CardHeading text="Etc." />
      <CardInfo title="Profit factor" info={to4Digits(profitFactor)} />
      <Divider />
      <CardInfo title="Return of Investment" info={to4Digits(returnOfInvestment)} />
      <Divider />
      <CardInfo title="Total Trade Volume" info={`${toLocale(totalTradeVolume, 8)} ${assetCurrency}`} />
      <Divider />
      <CardInfo
        title="Total Fees"
        info={
          <div className="text-right">
            <Typography>
              {toLocale(totalFees.inCapitalCurrency, 4)} {assetCurrency}
            </Typography>
            <Typography>
              {toLocale(totalFees.inCapitalCurrency, 4)} {capitalCurrency}
            </Typography>
          </div>
        }
      />
      <Divider />
      <CardInfo
        title="Backtest period"
        info={
          <div className="text-right">
            <Typography>{backtestDuration}</Typography>
            <Typography className="opacity-50">
              {`(${format(startTimestamp, 'yyyy-MM-dd HH:mm:ss')} - ${format(
                endTimestamp,
                'yyyy-MM-dd HH:mm:ss',
              )}
              )`}
            </Typography>
          </div>
        }
      />
    </MetricsCard>
  );
}

function MetricsCard({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <Card className={mergeClassName('flex max-w-lg flex-grow flex-col gap-y-2 p-6 shadow-4', className)}>
      {children}
    </Card>
  );
}
function CardHeading({ text }: { text: string }) {
  return (
    <Typography className="mb-4 font-bold" variant="h5" component="p">
      {text}
    </Typography>
  );
}
function CardInfo({ title, info }: { title: string; info: string | number | JSX.Element }) {
  return (
    <div className="flex justify-between">
      <Typography className="font-medium">{title}</Typography>
      {is(String, info) || is(Number, info) ? <Typography>{info}</Typography> : info}
    </div>
  );
}

const equityChartOptions: DeepPartial<ChartOptions> = {
  height: 500,
  autoSize: true,
  timeScale: { timeVisible: true },
  grid: { vertLines: { visible: false } },
};
const equitySeriesOptions: Partial<LineSeriesOptions> = {
  priceLineVisible: false,
  lastValueVisible: false,
  color: '#f59e0b',
};
const buyAndHoldSeriesOptions: Partial<LineSeriesOptions> = {
  priceLineVisible: false,
  lastValueVisible: false,
  color: '#4338ca',
};
const initialCapitalPriceLineOptions: Partial<CreatePriceLineOptions> & { id: string } = {
  id: 'initialCapital',
  title: 'Inital capital',
  color: '#00000033',
  lineStyle: LineStyle.LargeDashed,
  lineWidth: 3,
};

type EquityChartProps = {
  initialCapital: InitialCapital;
  capitalCurrency: CapitalCurrency;
  equityHistory: EquityHistory;
  buyAndHoldHistory: BuyAndHoldHistory;
};
function EquityChart(props: EquityChartProps) {
  const { initialCapital, capitalCurrency, equityHistory, buyAndHoldHistory } = props;

  const { container, handleContainerRef } = useChartContainer();
  const priceLinesOptions = useMemo<(CreatePriceLineOptions & { id: string })[]>(
    () => [{ ...initialCapitalPriceLineOptions, price: initialCapital }],
    [initialCapital],
  );

  const equityData: LineData<UTCTimestamp>[] = equityHistory.map(modify('time', dateToUtcTimestamp));
  const buyAndHoldData: LineData<UTCTimestamp>[] = buyAndHoldHistory.map(modify('time', dateToUtcTimestamp));

  return (
    <div className="relative" ref={handleContainerRef}>
      {o.isNone(container) ? undefined : (
        <Chart.Container id="equity" container={container.value} options={equityChartOptions}>
          <div className="absolute left-4 top-4 z-10">
            <Chart.Series
              id="equity"
              type="Line"
              data={equityData}
              options={equitySeriesOptions}
              priceLinesOptions={priceLinesOptions}
            >
              <div className="flex">
                <Typography className="mr-2 font-medium" color={equitySeriesOptions.color}>
                  Equity
                </Typography>
                <Chart.SeriesValue
                  defaultValue={equityData.at(-1)?.value}
                  formatValue={(x) => toLocale(x, 2).concat(` ${capitalCurrency}`)}
                />
              </div>
            </Chart.Series>
            <Chart.Series id="buyAndHold" type="Line" data={buyAndHoldData} options={buyAndHoldSeriesOptions}>
              <div className="flex">
                <Typography className="mr-2 font-medium" color={buyAndHoldSeriesOptions.color}>
                  Buy&Hold
                </Typography>
                <Chart.SeriesValue
                  defaultValue={buyAndHoldData.at(-1)?.value}
                  formatValue={(x) => toLocale(x, 2).concat(` ${capitalCurrency}`)}
                />
              </div>
            </Chart.Series>
          </div>
        </Chart.Container>
      )}
    </div>
  );
}
