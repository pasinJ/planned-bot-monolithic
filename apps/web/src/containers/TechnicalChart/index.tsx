import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Zoom from '@mui/material/Zoom';
import * as o from 'fp-ts/lib/Option';
import { flow } from 'fp-ts/lib/function';
import {
  ChartOptions,
  DeepPartial,
  LogicalRangeChangeEventHandler,
  MouseEventHandler,
  Time,
} from 'lightweight-charts';
import { nanoid } from 'nanoid';
import { append, equals, includes, reject, uniq } from 'ramda';
import { useContext, useMemo, useRef, useState } from 'react';
import { match } from 'ts-pattern';

import MaterialSymbol from '#components/MaterialSymbol';
import { Order, formatOrderTimestamp } from '#features/btStrategies/order';
import { Kline, formatKlineTimestamps, isIntraDayTimeframe } from '#features/klines/kline';
import useOpenPopover from '#hooks/useOpenPopover';
import { InfraContext } from '#infra/InfraProvider.context';

import { AdChart, AdChartType } from './AdChart';
import { AdxChart, AdxChartType } from './AdxChart';
import { AtrChart, AtrChartType } from './AtrChart';
import { BbSeries, BbSeriesType } from './BbSeries';
import { BbwChart, BbwChartType } from './BbwChart';
import { EmaSeries, EmaSeriesType } from './EmaSeries';
import { EmvChart, EmvChartType } from './EmvChart';
import { KcSeries, KcSeriesType } from './KcSeries';
import { MacdChart, MacdChartType } from './MacdChart';
import { MfiChart, MfiChartType } from './MfiChart';
import { MomChart, MomChartType } from './MomChart';
import { ObvChart, ObvChartType } from './ObvChart';
import { PriceChart, PriceChartType } from './PriceChart';
import { PsarSeries, PsarSeriesType } from './PsarSeries';
import { PvtChart, PvtChartType } from './PvtChart';
import { RocChart, RocChartType } from './RocChart';
import { RsiChart, RsiChartType } from './RsiChart';
import { SmaSeries, SmaSeriesType } from './SmaSeries';
import { StochChart, StochChartType } from './StochChart';
import { SupertrendSeries, SupertrendSeriesType } from './SupertrendSeries';
import { VwapSeries, VwapSeriesType } from './VwapSeries';
import { VwmaSeries, VwmaSeriesType } from './VwmaSeries';
import { WadChart, WadChartType } from './WadChart';
import { WmaSeries, WmaSeriesType } from './WmaSeries';
import { ChartObj } from '../Chart/ChartContainer';
import { isMouseInDataRange, isMouseOffChart } from './utils';

type ChartObjs = Map<string, ChartObj>;
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
    const timeframe = klines.at(0)?.timeframe;
    const timeOptions: Partial<ChartOptions['timeScale']> =
      timeframe && timeframe === '1s'
        ? { secondsVisible: true }
        : timeframe && isIntraDayTimeframe(timeframe)
        ? { timeVisible: true, secondsVisible: false }
        : { timeVisible: false };
    return index === chartsList.length - 1
      ? { timeScale: { visible: true, ...timeOptions } }
      : { timeScale: { visible: false } };
  }

  const chartObjs = useRef<ChartObjs>(new Map());
  function handleChartRef(chartType: IndicatorChartType) {
    return (chartObj: o.Option<ChartObj> | null) => {
      if (chartObj && o.isSome(chartObj)) chartObjs.current.set(chartType, chartObj.value);
    };
  }
  const handleSyncTimeScale = (chartType: IndicatorChartType): LogicalRangeChangeEventHandler => {
    return (timeRange) => {
      if (timeRange === null) return;

      chartObjs.current.forEach((chartObj, key) => {
        if (key !== chartType) chartObj.getChart().timeScale().setVisibleLogicalRange(timeRange);
      });
    };
  };
  const handleSyncVerticalCrosshair = (chartType: IndicatorChartType): MouseEventHandler<Time> => {
    return (param) => {
      chartObjs.current.forEach((chartObj, key) => {
        if (key !== chartType) {
          if (isMouseInDataRange(param.time)) {
            const mainSeries = chartObj.getSeriesList().at(0);
            if (mainSeries === undefined) return;

            chartObj.getChart().setCrosshairPosition(Infinity, param.time, mainSeries);
          } else if (isMouseOffChart(param.point)) {
            chartObj.getChart().clearCrosshairPosition();
          }
        }
      });
    };
  };

  return (
    <>
      <TopBar
        selectedChartsList={chartsList}
        handleAddSeries={handleAddSeries}
        handleAddChart={handleAddChart}
      />
      {chartsList.map((chartType, index) => {
        const chartProps = {
          key: chartType,
          ref: handleChartRef(chartType),
          klines: localKlines,
          orders: localOrders,
          options: chartOptions(index),
          crosshairMoveCb: handleSyncVerticalCrosshair(chartType),
          logicalRangeChangeCb: handleSyncTimeScale(chartType),
        };

        return match(chartType)
          .with('price', () => (
            <PriceChart {...chartProps}>
              {Array.from(seriesMap).map(([id, seriesType]) => {
                const seriesProps = { id, key: id, klines: localKlines, handleRemoveSeries };

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
    </>
  );
}

function TopBar(props: {
  selectedChartsList: IndicatorChartType[];
  handleAddSeries: AddSeries;
  handleAddChart: AddChart;
}) {
  return (
    <div className="flex justify-end bg-surface-3">
      <IndicatorsMenu {...props} />
    </div>
  );
}

function IndicatorsMenu(props: {
  selectedChartsList: IndicatorChartType[];
  handleAddSeries: AddSeries;
  handleAddChart: AddChart;
}) {
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
            <SeriesMenuItem
              menuText="SMA"
              title="Simple Moving Average"
              seriesType="sma"
              handleAddSeries={handleAddSeries}
            />
            <SeriesMenuItem
              menuText="EMA"
              title="Exponential Moving Average"
              seriesType="ema"
              handleAddSeries={handleAddSeries}
            />
            <SeriesMenuItem
              menuText="WMA"
              title="Weighted Moving Average"
              seriesType="wma"
              handleAddSeries={handleAddSeries}
            />
            <SeriesMenuItem
              menuText="VWMA"
              title="Volume Weighted Moving Average"
              seriesType="vwma"
              handleAddSeries={handleAddSeries}
            />
            <SeriesMenuItem
              menuText="PSAR"
              title="Parabolic SAR"
              seriesType="psar"
              handleAddSeries={handleAddSeries}
            />
            <SeriesMenuItem
              menuText="Supertrend"
              title="Supertrend"
              seriesType="supertrend"
              handleAddSeries={handleAddSeries}
            />
            <SeriesMenuItem
              menuText="VWAP"
              title="Volume-Weighted Average Price"
              seriesType="vwap"
              handleAddSeries={handleAddSeries}
            />
            <SeriesMenuItem
              menuText="BB"
              title="Bollinger Bands"
              seriesType="bb"
              handleAddSeries={handleAddSeries}
            />
            <SeriesMenuItem
              menuText="KC"
              title="Keltner Channels"
              seriesType="kc"
              handleAddSeries={handleAddSeries}
            />
          </div>
          <Divider orientation="vertical" variant="middle" flexItem />
          <div className="min-w-[8rem]">
            <Typography variant="body1" className="px-4 py-2 font-bold">
              Charts
            </Typography>
            <ChartMenuItem
              menuText="MACD"
              title="Moving Average Convergence Divergence"
              chartType="macd"
              selectedChartsList={selectedChartsList}
              handleAddChart={handleAddChart}
            />
            <ChartMenuItem
              menuText="RSI"
              title="Relative Strength Index"
              chartType="rsi"
              selectedChartsList={selectedChartsList}
              handleAddChart={handleAddChart}
            />
            <ChartMenuItem
              menuText="Stoch"
              title="Stochastic Oscillator"
              chartType="stoch"
              selectedChartsList={selectedChartsList}
              handleAddChart={handleAddChart}
            />
            <ChartMenuItem
              menuText="OBV"
              title="On-Balance Volume"
              chartType="obv"
              selectedChartsList={selectedChartsList}
              handleAddChart={handleAddChart}
            />
            <ChartMenuItem
              menuText="PVT"
              title="Price Volume Trend"
              chartType="pvt"
              selectedChartsList={selectedChartsList}
              handleAddChart={handleAddChart}
            />
            <ChartMenuItem
              menuText="MFI"
              title="Money Flow Index"
              chartType="mfi"
              selectedChartsList={selectedChartsList}
              handleAddChart={handleAddChart}
            />
            <ChartMenuItem
              menuText="A/D"
              title="Accumulation/Distribution"
              chartType="ad"
              selectedChartsList={selectedChartsList}
              handleAddChart={handleAddChart}
            />
            <ChartMenuItem
              menuText="W A/D"
              title="Williams Accumulation/Distribution"
              chartType="wad"
              selectedChartsList={selectedChartsList}
              handleAddChart={handleAddChart}
            />
            <ChartMenuItem
              menuText="EMV"
              title="Ease of Movement"
              chartType="emv"
              selectedChartsList={selectedChartsList}
              handleAddChart={handleAddChart}
            />
            <ChartMenuItem
              menuText="Momentum"
              title="Momentum"
              chartType="mom"
              selectedChartsList={selectedChartsList}
              handleAddChart={handleAddChart}
            />
            <ChartMenuItem
              menuText="ADX"
              title="Average Directional Index"
              chartType="adx"
              selectedChartsList={selectedChartsList}
              handleAddChart={handleAddChart}
            />
            <ChartMenuItem
              menuText="ROC"
              title="Rate of Change"
              chartType="roc"
              selectedChartsList={selectedChartsList}
              handleAddChart={handleAddChart}
            />
            <ChartMenuItem
              menuText="BBW"
              title="Bollinger Bands Width"
              chartType="bbw"
              selectedChartsList={selectedChartsList}
              handleAddChart={handleAddChart}
            />
            <ChartMenuItem
              menuText="ATR"
              title="Average True Range"
              chartType="atr"
              selectedChartsList={selectedChartsList}
              handleAddChart={handleAddChart}
            />
          </div>
        </div>
      </Menu>
    </>
  );
}

function SeriesMenuItem(props: {
  title: string;
  menuText: string;
  seriesType: IndicatorSeriesType;
  handleAddSeries: AddSeries;
}) {
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

function ChartMenuItem(props: {
  title: string;
  menuText: string;
  chartType: IndicatorChartType;
  selectedChartsList: IndicatorChartType[];
  handleAddChart: AddChart;
}) {
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
