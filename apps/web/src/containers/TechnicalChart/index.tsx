import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Zoom from '@mui/material/Zoom';
import { Decimal } from 'decimal.js';
import { flow } from 'fp-ts/lib/function';
import { BarPrice, ChartOptions, DeepPartial } from 'lightweight-charts';
import { nanoid } from 'nanoid';
import { append, equals, includes, reject, uniq } from 'ramda';
import { useContext, useMemo, useState } from 'react';
import { match } from 'ts-pattern';

import MaterialSymbol from '#components/MaterialSymbol';
import Chart from '#containers/Chart';
import { Order, formatOrderTimestamp } from '#features/btStrategies/order';
import { Kline, formatKlineTimestamps, isIntraDayTimeframe } from '#features/klines/kline';
import useOpenPopover from '#hooks/useOpenPopover';
import { InfraContext } from '#infra/InfraProvider.context';

import AdChart, { AdChartType } from './AdChart';
import AdxChart, { AdxChartType } from './AdxChart';
import AtrChart, { AtrChartType } from './AtrChart';
import BbSeries, { BbSeriesType } from './BbSeries';
import BbwChart, { BbwChartType } from './BbwChart';
import EmaSeries, { EmaSeriesType } from './EmaSeries';
import EmvChart, { EmvChartType } from './EmvChart';
import KcSeries, { KcSeriesType } from './KcSeries';
import MacdChart, { MacdChartType } from './MacdChart';
import MfiChart, { MfiChartType } from './MfiChart';
import MomChart, { MomChartType } from './MomChart';
import ObvChart, { ObvChartType } from './ObvChart';
import PriceChart, { PriceChartType } from './PriceChart';
import PsarSeries, { PsarSeriesType } from './PsarSeries';
import PvtChart, { PvtChartType } from './PvtChart';
import RocChart, { RocChartType } from './RocChart';
import RsiChart, { RsiChartType } from './RsiChart';
import SmaSeries, { SmaSeriesType } from './SmaSeries';
import StochChart, { StochChartType } from './StochChart';
import SupertrendSeries, { SupertrendSeriesType } from './SupertrendSeries';
import VwapSeries, { VwapSeriesType } from './VwapSeries';
import VwmaSeries, { VwmaSeriesType } from './VwmaSeries';
import WadChart, { WadChartType } from './WadChart';
import WmaSeries, { WmaSeriesType } from './WmaSeries';

type SeriesMap = Map<string, IndicatorSeriesType>;

type IndicatorChartType =
  | PriceChartType
  | MacdChartType
  | ObvChartType
  | PvtChartType
  | MfiChartType
  | AdChartType
  | WadChartType
  | EmvChartType
  | MomChartType
  | RsiChartType
  | AdxChartType
  | RocChartType
  | StochChartType
  | BbwChartType
  | AtrChartType;
type IndicatorSeriesType =
  | SmaSeriesType
  | EmaSeriesType
  | WmaSeriesType
  | VwmaSeriesType
  | PsarSeriesType
  | SupertrendSeriesType
  | VwapSeriesType
  | BbSeriesType
  | KcSeriesType;

type AddSeries = (seriesType: IndicatorSeriesType) => void;
type AddChart = (chartType: IndicatorChartType) => void;

const SPACE_FOR_DECIMAL_POINT_AND_MINUS_SIGN = 2;

type TechnicalChartProps = { klines: readonly Kline[]; orders?: readonly Order[] };
export default function TechnicalChart(props: TechnicalChartProps) {
  const { klines, orders } = props;

  const { dateService } = useContext(InfraContext);
  const timezone = dateService.getTimezone();
  const localKlines = useMemo(
    () => klines.map((kline) => formatKlineTimestamps(kline, timezone)),
    [klines, timezone],
  );
  const localOrders = useMemo(
    () => orders?.map((order) => formatOrderTimestamp(order, timezone)),
    [orders, timezone],
  );
  const { maxDecimalDigits, maxSignificantDigits } = useMemo(
    () =>
      localKlines.reduce(
        (prev, kline) => ({
          maxDecimalDigits: Math.max(
            prev.maxDecimalDigits,
            new Decimal(kline.open).decimalPlaces(),
            new Decimal(kline.high).decimalPlaces(),
            new Decimal(kline.low).decimalPlaces(),
            new Decimal(kline.close).decimalPlaces(),
            new Decimal(kline.volume).decimalPlaces(),
          ),
          maxSignificantDigits: Math.max(
            prev.maxSignificantDigits,
            new Decimal(kline.open).precision(true),
            new Decimal(kline.high).precision(true),
            new Decimal(kline.low).precision(true),
            new Decimal(kline.close).precision(true),
            new Decimal(kline.volume).precision(true),
          ),
        }),
        { maxDecimalDigits: -Infinity, maxSignificantDigits: -Infinity },
      ),
    [localKlines],
  );

  const [chartsList, setChartsList] = useState<IndicatorChartType[]>(['price']);
  const handleAddChart: AddChart = (chartType) => setChartsList(flow(append(chartType), uniq));
  const handleRemoveChart = (chartType: IndicatorChartType) => setChartsList(reject(equals(chartType)));

  const [seriesMap, setSeriesMap] = useState<SeriesMap>(new Map());
  const handleAddSeries: AddSeries = (seriesType) => {
    setSeriesMap((prevSeriesMap) => {
      const newSeriesmap = new Map(prevSeriesMap);
      newSeriesmap.set(nanoid(), seriesType);
      return newSeriesmap;
    });
  };
  const handleRemoveSeries = (id: string) => {
    setSeriesMap((prevSeriesMap) => {
      const newSeriesmap = new Map(prevSeriesMap);
      newSeriesmap.delete(id);
      return newSeriesmap;
    });
  };

  function chartOptions(index: number): DeepPartial<ChartOptions> {
    const baseOptions: DeepPartial<ChartOptions> = {
      localization: {
        priceFormatter: (p: BarPrice) =>
          `${p
            .toFixed(maxDecimalDigits)
            .padStart(maxSignificantDigits + SPACE_FOR_DECIMAL_POINT_AND_MINUS_SIGN)}`,
      },
    };

    const timeframe = klines.at(0)?.timeframe;
    const timeOptions: Partial<ChartOptions['timeScale']> =
      timeframe && timeframe === '1s'
        ? { secondsVisible: true }
        : timeframe && isIntraDayTimeframe(timeframe)
        ? { timeVisible: true, secondsVisible: false }
        : { timeVisible: false };

    return index === chartsList.length - 1
      ? { ...baseOptions, timeScale: { visible: true, ...timeOptions } }
      : { ...baseOptions, timeScale: { visible: false } };
  }

  return (
    <>
      <TopBar
        selectedChartsList={chartsList}
        handleAddSeries={handleAddSeries}
        handleAddChart={handleAddChart}
      />
      <Chart.Group syncTimeScale={true} syncCrosshairMove={true}>
        {chartsList.map((chartType, index) => {
          const chartProps = {
            key: chartType,
            klines: localKlines,
            orders: localOrders,
            options: chartOptions(index),
            maxDecimalDigits,
          };

          return match(chartType)
            .with('price', () => (
              <PriceChart {...chartProps}>
                {Array.from(seriesMap).map(([id, seriesType]) => {
                  const seriesProps = {
                    id,
                    key: id,
                    klines: localKlines,
                    maxDecimalDigits,
                    handleRemoveSeries,
                  };
                  return match(seriesType)
                    .with('sma', () => <SmaSeries {...seriesProps} />)
                    .with('ema', () => <EmaSeries {...seriesProps} />)
                    .with('wma', () => <WmaSeries {...seriesProps} />)
                    .with('vwma', () => <VwmaSeries {...seriesProps} />)
                    .with('psar', () => <PsarSeries {...seriesProps} />)
                    .with('supertrend', () => <SupertrendSeries {...seriesProps} />)
                    .with('vwap', () => <VwapSeries {...seriesProps} />)
                    .with('bb', () => <BbSeries {...seriesProps} />)
                    .with('kc', () => <KcSeries {...seriesProps} />)
                    .exhaustive();
                })}
              </PriceChart>
            ))
            .with('macd', () => <MacdChart {...chartProps} handleRemoveChart={handleRemoveChart} />)
            .with('obv', () => <ObvChart {...chartProps} handleRemoveChart={handleRemoveChart} />)
            .with('pvt', () => <PvtChart {...chartProps} handleRemoveChart={handleRemoveChart} />)
            .with('mfi', () => <MfiChart {...chartProps} handleRemoveChart={handleRemoveChart} />)
            .with('ad', () => <AdChart {...chartProps} handleRemoveChart={handleRemoveChart} />)
            .with('wad', () => <WadChart {...chartProps} handleRemoveChart={handleRemoveChart} />)
            .with('emv', () => <EmvChart {...chartProps} handleRemoveChart={handleRemoveChart} />)
            .with('mom', () => <MomChart {...chartProps} handleRemoveChart={handleRemoveChart} />)
            .with('rsi', () => <RsiChart {...chartProps} handleRemoveChart={handleRemoveChart} />)
            .with('adx', () => <AdxChart {...chartProps} handleRemoveChart={handleRemoveChart} />)
            .with('roc', () => <RocChart {...chartProps} handleRemoveChart={handleRemoveChart} />)
            .with('stoch', () => <StochChart {...chartProps} handleRemoveChart={handleRemoveChart} />)
            .with('bbw', () => <BbwChart {...chartProps} handleRemoveChart={handleRemoveChart} />)
            .with('atr', () => <AtrChart {...chartProps} handleRemoveChart={handleRemoveChart} />)
            .exhaustive();
        })}
      </Chart.Group>
    </>
  );
}

type TopBarProps = {
  selectedChartsList: IndicatorChartType[];
  handleAddSeries: AddSeries;
  handleAddChart: AddChart;
};
function TopBar(props: TopBarProps) {
  return (
    <div className="flex justify-end bg-surface-3">
      <IndicatorsMenu {...props} />
    </div>
  );
}

const seriesIndicators = [
  { seriesType: 'sma', menuText: 'SMA', title: 'Simple Moving Average' },
  { seriesType: 'ema', menuText: 'EMA', title: 'Exponential Moving Average' },
  { seriesType: 'wma', menuText: 'WMA', title: 'Weighted Moving Average' },
  { seriesType: 'vwma', menuText: 'VWMA', title: 'Volume Weighted Moving Average' },
  { seriesType: 'psar', menuText: 'PSAR', title: 'Parabolic SAR' },
  { seriesType: 'supertrend', menuText: 'Supertrend', title: 'Supertrend' },
  { seriesType: 'vwap', menuText: 'VWAP', title: 'Volume-Weighted Average Price' },
  { seriesType: 'bb', menuText: 'BB', title: 'Bollinger Bands' },
  { seriesType: 'kc', menuText: 'KC', title: 'Keltner Channels' },
] as const;
const chartIndicators = [
  { chartType: 'macd', menuText: 'MACD', title: 'Moving Average Convergence Divergence' },
  { chartType: 'rsi', menuText: 'RSI', title: 'Relative Strength Index' },
  { chartType: 'stoch', menuText: 'Stoch', title: 'Stochastic Oscillator' },
  { chartType: 'obv', menuText: 'OBV', title: 'On-Balance Volume' },
  { chartType: 'pvt', menuText: 'PVT', title: 'Price Volume Trend' },
  { chartType: 'mfi', menuText: 'MFI', title: 'Money Flow Index' },
  { chartType: 'ad', menuText: 'A/D', title: 'Accumulation/Distribution' },
  { chartType: 'emv', menuText: 'EMV', title: 'Ease of Movement' },
  { chartType: 'mom', menuText: 'Momentum', title: 'Momentum' },
  { chartType: 'adx', menuText: 'ADX', title: 'Average Directional Index' },
  { chartType: 'roc', menuText: 'ROC', title: 'Rate of Change' },
  { chartType: 'bbw', menuText: 'BBW', title: 'Bollinger Bands Width' },
  { chartType: 'atr', menuText: 'ATR', title: 'Average True Range' },
] as const;

type IndicatorsMenuProps = {
  selectedChartsList: IndicatorChartType[];
  handleAddSeries: AddSeries;
  handleAddChart: AddChart;
};
function IndicatorsMenu(props: IndicatorsMenuProps) {
  const { selectedChartsList, handleAddSeries, handleAddChart } = props;

  const [open, anchorElement, handleOpenMenu, handleCloseMenu] = useOpenPopover();

  return (
    <>
      <Button
        className="px-6 py-3"
        startIcon={<MaterialSymbol className="pb-0.5" symbol="add" />}
        onClick={handleOpenMenu}
      >
        Indicators
      </Button>
      <Menu
        open={open}
        anchorEl={anchorElement}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { className: 'max-h-48' } }}
        onClose={handleCloseMenu}
      >
        <div className="flex">
          <div className="min-w-[8rem]">
            <Typography variant="body1" className="px-4 py-2 font-bold">
              Series
            </Typography>
            {seriesIndicators.map((props, index) => (
              <SeriesMenuItem key={index} handleAddSeries={handleAddSeries} {...props} />
            ))}
          </div>
          <Divider orientation="vertical" variant="middle" flexItem />
          <div className="min-w-[8rem]">
            <Typography variant="body1" className="px-4 py-2 font-bold">
              Charts
            </Typography>
            {chartIndicators.map((props, index) => (
              <ChartMenuItem
                key={index}
                selectedChartsList={selectedChartsList}
                handleAddChart={handleAddChart}
                {...props}
              />
            ))}
          </div>
        </div>
      </Menu>
    </>
  );
}

type SeriesMenuItemProps = {
  title: string;
  menuText: string;
  seriesType: IndicatorSeriesType;
  handleAddSeries: AddSeries;
};
function SeriesMenuItem(props: SeriesMenuItemProps) {
  const { title, menuText, seriesType, handleAddSeries } = props;

  return (
    <Tooltip
      title={title}
      TransitionComponent={Zoom}
      followCursor
      enterDelay={500}
      enterNextDelay={500}
      slotProps={{ tooltip: { className: 'text-lg' } }}
    >
      <MenuItem onClick={() => handleAddSeries(seriesType)}>
        <ListItemText>{menuText}</ListItemText>
        <ListItemIcon className="min-w-fit">
          <MaterialSymbol className="text-primary" symbol="add" />
        </ListItemIcon>
      </MenuItem>
    </Tooltip>
  );
}

type ChartMenuItemProps = {
  title: string;
  menuText: string;
  chartType: IndicatorChartType;
  selectedChartsList: IndicatorChartType[];
  handleAddChart: AddChart;
};
function ChartMenuItem(props: ChartMenuItemProps) {
  const { title, menuText, chartType, selectedChartsList, handleAddChart } = props;

  const isChartSelected = includes(chartType, selectedChartsList);

  return (
    <Tooltip
      title={title}
      TransitionComponent={Zoom}
      followCursor
      enterDelay={500}
      enterNextDelay={500}
      slotProps={{ tooltip: { className: 'text-lg' } }}
    >
      <MenuItem className={isChartSelected ? 'bg-surface' : ''} onClick={() => handleAddChart(chartType)}>
        <ListItemText>{menuText}</ListItemText>
        <ListItemIcon className={`min-w-fit ${isChartSelected ? '' : 'hidden'}`}>
          <MaterialSymbol className="text-primary" symbol="check" />
        </ListItemIcon>
      </MenuItem>
    </Tooltip>
  );
}
