import Button from '@mui/material/Button';
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
import { append, equals, reject, uniq } from 'ramda';
import { useRef, useState } from 'react';
import { match } from 'ts-pattern';

import { Kline } from '#features/klines/kline';
import rawKlines from '#test-utils/klines.json';

import { AdChart, AdChartType } from './AdChart';
import { EmaSeries, EmaSeriesType } from './EmaSeries';
import { MacdChart, MacdChartType } from './MacdChart';
import { MfiChart, MfiChartType } from './MfiChart';
import { ObvChart, ObvChartType } from './ObvChart';
import { PriceChart, PriceChartType } from './PriceChart';
import { PsarSeries, PsarSeriesType } from './PsarSeries';
import { PvtChart, PvtChartType } from './PvtChart';
import { SmaSeries, SmaSeriesType } from './SmaSeries';
import { SupertrendSeries, SupertrendSeriesType } from './SupertrendSeries';
import { VwmaSeries, VwmaSeriesType } from './VwmaSeries';
import { WmaSeries, WmaSeriesType } from './WmaSeries';
import { ChartObj } from './containers/ChartContainer';
import { isMouseInDataRange, isMouseOffChart } from './utils';

const klines = rawKlines.map(
  ([openTimestamp, open, high, low, close, volume, closeTimestamp, quoteAssetVolume, numOfTrades]) =>
    ({
      exchange: 'BINANCE',
      symbol: 'BTCUSDT',
      timeframe: '1h',
      openTimestamp: new Date(openTimestamp),
      open: Number(open),
      high: Number(high),
      low: Number(low),
      close: Number(close),
      volume: Number(volume),
      closeTimestamp: new Date(closeTimestamp),
      quoteAssetVolume: Number(quoteAssetVolume),
      numTradests: Number(numOfTrades),
    }) as unknown as Kline,
);

type ChartObjs = Map<string, ChartObj>;
type IndicatorChartType =
  | PriceChartType
  | MacdChartType
  | ObvChartType
  | PvtChartType
  | MfiChartType
  | AdChartType;
type SeriesMap = Map<string, IndicatorSeriesType>;
type IndicatorSeriesType =
  | SmaSeriesType
  | EmaSeriesType
  | WmaSeriesType
  | VwmaSeriesType
  | PsarSeriesType
  | SupertrendSeriesType;

export default function TechnicalChart() {
  const [chartsList, setChartsList] = useState<IndicatorChartType[]>(['price']);
  const handleAddChart = (chartType: IndicatorChartType) => setChartsList(flow(append(chartType), uniq));
  const handleRemoveChart = (chartType: IndicatorChartType) => setChartsList(reject(equals(chartType)));

  const [seriesMap, setSeriesMap] = useState<SeriesMap>(new Map([[nanoid(), 'sma']]));
  const handleAddSeries = (seriesType: IndicatorSeriesType) => {
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
    return index === chartsList.length - 1
      ? { timeScale: { visible: true } }
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
          } else if (isMouseOffChart(param)) {
            chartObj.getChart().clearCrosshairPosition();
          }
        }
      });
    };
  };

  return (
    <>
      <Button onClick={() => handleAddChart('macd')}>Add MACD</Button>
      <Button onClick={() => handleAddChart('obv')}>Add OBV</Button>
      <Button onClick={() => handleAddChart('pvt')}>Add PVT</Button>
      <Button onClick={() => handleAddChart('mfi')}>Add MFI</Button>
      <Button onClick={() => handleAddChart('ad')}>Add AD</Button>
      <Button onClick={() => handleAddSeries('sma')}>Add SMA</Button>
      <Button onClick={() => handleAddSeries('ema')}>Add EMA</Button>
      <Button onClick={() => handleAddSeries('psar')}>Add PSAR</Button>
      <Button onClick={() => handleAddSeries('supertrend')}>Add Supertrend</Button>
      {chartsList.map((chartType, index) => {
        const chartProps = {
          key: chartType,
          ref: handleChartRef(chartType),
          klines,
          options: chartOptions(index),
          crosshairMoveCb: handleSyncVerticalCrosshair(chartType),
          logicalRangeChangeCb: handleSyncTimeScale(chartType),
        };

        return match(chartType)
          .with('price', () => (
            <PriceChart {...chartProps}>
              {Array.from(seriesMap).map(([id, seriesType]) => {
                const seriesProps = { id, key: id, klines, handleRemoveSeries };

                return match(seriesType)
                  .with('sma', () => <SmaSeries {...seriesProps} />)
                  .with('ema', () => <EmaSeries {...seriesProps} />)
                  .with('wma', () => <WmaSeries {...seriesProps} />)
                  .with('vwma', () => <VwmaSeries {...seriesProps} />)
                  .with('psar', () => <PsarSeries {...seriesProps} />)
                  .with('supertrend', () => <SupertrendSeries {...seriesProps} />)
                  .exhaustive();
              })}
            </PriceChart>
          ))
          .with('macd', () => <MacdChart {...chartProps} handleRemoveChart={handleRemoveChart} />)
          .with('obv', () => <ObvChart {...chartProps} handleRemoveChart={handleRemoveChart} />)
          .with('pvt', () => <PvtChart {...chartProps} handleRemoveChart={handleRemoveChart} />)
          .with('mfi', () => <MfiChart {...chartProps} handleRemoveChart={handleRemoveChart} />)
          .with('ad', () => <AdChart {...chartProps} handleRemoveChart={handleRemoveChart} />)
          .exhaustive();
      })}
    </>
  );
}
