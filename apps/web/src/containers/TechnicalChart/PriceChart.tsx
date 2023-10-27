import Typography from '@mui/material/Typography';
import { getUnixTime } from 'date-fns';
import * as e from 'fp-ts/lib/Either';
import * as o from 'fp-ts/lib/Option';
import {
  CandlestickData,
  CandlestickStyleOptions,
  DeepPartial,
  HistogramData,
  HistogramSeriesOptions,
  LogicalRangeChangeEventHandler,
  MouseEventHandler,
  PriceScaleOptions,
  SeriesMarker,
  SeriesOptionsCommon,
  Time,
  TimeChartOptions,
  UTCTimestamp,
} from 'lightweight-charts';
import { mergeDeepRight } from 'ramda';
import { PropsWithChildren, forwardRef, useCallback, useMemo, useState } from 'react';

import { Order } from '#features/btStrategies/order';
import { Kline } from '#features/klines/kline';
import useClickToggle from '#hooks/useClickToggle';

import VisibilityButton from './components/VisibilityButton';
import { ChartContainer, ChartObj } from './containers/ChartContainer';
import ChartTooltip from './containers/ChartTooltip';
import { Series, SeriesObj } from './containers/Series';
import useChartContainer from './hooks/useChartContainer';
import useSeriesLegend from './hooks/useSeriesLegend';
import useSeriesObjRef from './hooks/useSeriesObjRef';
import {
  downColor,
  formatLegend,
  isMouseInDataRange,
  isMouseOffChart,
  ordersToMarkersAndEvents,
  upColor,
} from './utils';

export type PriceChartType = 'price';

const defaultChartOptions: DeepPartial<TimeChartOptions> = { height: 500 };

type PriceChartProps = PropsWithChildren<{
  klines: readonly Kline[];
  orders?: readonly Order[];
  options?: DeepPartial<TimeChartOptions>;
  crosshairMoveCb?: MouseEventHandler<Time>;
  logicalRangeChangeCb?: LogicalRangeChangeEventHandler;
}>;
export const PriceChart = forwardRef<o.Option<ChartObj>, PriceChartProps>(function PriceChart(props, ref) {
  const { klines, orders, options, crosshairMoveCb, logicalRangeChangeCb, children } = props;

  const { container, handleContainerRef } = useChartContainer();

  const symbol = klines.at(0)?.symbol ?? '???';
  const prices = klines.map(({ openTimestamp, open, high, low, close }) => ({
    time: getUnixTime(openTimestamp) as UTCTimestamp,
    open,
    high,
    low,
    close,
  }));
  const volumes = klines.map(({ openTimestamp, volume, open, close }) => ({
    time: getUnixTime(openTimestamp) as UTCTimestamp,
    value: volume,
    color: open > close ? downColor : upColor,
  }));
  const { markers, events } = useMemo(
    () => (orders ? ordersToMarkersAndEvents(klines, orders) : { markers: undefined, events: undefined }),
    [klines, orders],
  );

  const chartOptions: DeepPartial<TimeChartOptions> = useMemo(
    () => mergeDeepRight(defaultChartOptions, options ?? {}),
    [options],
  );

  return (
    <div className="relative overflow-hidden" ref={handleContainerRef}>
      {o.isNone(container) ? undefined : (
        <ChartContainer
          ref={ref}
          container={container.value}
          options={chartOptions}
          crosshairMoveCb={crosshairMoveCb}
          logicalRangeChangeCb={logicalRangeChangeCb}
        >
          <div className="absolute left-3 top-3 z-10 max-w-lg">
            <div className=" flex w-fit space-x-6">
              <Typography className="text-2xl font-medium">{symbol}</Typography>
              <div className="flex flex-col">
                <PriceSeries data={prices} markers={markers} />
                <VolumeSeries data={volumes} />
              </div>
            </div>
            <div className="flex max-h-48 flex-col space-y-1 overflow-auto whitespace-nowrap scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300">
              {children}
            </div>
          </div>
          {events ? <ChartTooltip events={events} /> : undefined}
        </ChartContainer>
      )}
    </div>
  );
});

const priceSeriesOption: DeepPartial<CandlestickStyleOptions & SeriesOptionsCommon> = { upColor, downColor };
const priceScaleOptionsOfPriceSeries: DeepPartial<PriceScaleOptions> = {
  scaleMargins: { top: 0.1, bottom: 0.4 },
};
type PriceSeriesProps = { data: CandlestickData[]; markers?: SeriesMarker<UTCTimestamp>[] };
const PriceSeries = forwardRef<o.Option<SeriesObj>, PriceSeriesProps>(function PriceSeries(props, ref) {
  const { data, markers } = props;

  const _series = useSeriesObjRef(ref);
  const [hidden, handleToggleHidden] = useClickToggle(false);

  type Legend = { open: string; high: string; low: string; close: string };
  const lastBarLegend: Legend = useMemo(() => {
    const lastBar = data.at(-1);
    return lastBar && 'open' in lastBar
      ? {
          open: formatLegend(lastBar.open),
          high: formatLegend(lastBar.high),
          low: formatLegend(lastBar.low),
          close: formatLegend(lastBar.close),
        }
      : { open: 'n/a', high: 'n/a', low: 'n/a', close: 'n/a' };
  }, [data]);
  const [legend, setLegend] = useState<Legend>(lastBarLegend);
  const updateLegend: MouseEventHandler<Time> = useCallback(
    (param) => {
      if (o.isNone(_series.current)) return;

      const series = _series.current.value.getSeries();
      if (e.isLeft(series)) {
        setLegend({ open: 'n/a', high: 'n/a', low: 'n/a', close: 'n/a' });
      } else {
        if (isMouseInDataRange(param.time)) {
          const priceBar = param.seriesData.get(series.right) as CandlestickData;
          setLegend({
            open: formatLegend(priceBar.open),
            high: formatLegend(priceBar.high),
            low: formatLegend(priceBar.low),
            close: formatLegend(priceBar.close),
          });
        } else if (isMouseOffChart(param.point)) {
          setLegend(lastBarLegend);
        } else {
          setLegend({ open: 'n/a', high: 'n/a', low: 'n/a', close: 'n/a' });
        }
      }
    },
    [lastBarLegend, _series],
  );

  const seriesOptions: DeepPartial<CandlestickStyleOptions & SeriesOptionsCommon> = useMemo(
    () => ({ ...priceSeriesOption, visible: !hidden }),
    [hidden],
  );

  return (
    <Series
      ref={_series}
      type="Candlestick"
      data={data}
      markers={markers}
      options={seriesOptions}
      priceScaleOptions={priceScaleOptionsOfPriceSeries}
      crosshairMoveCb={updateLegend}
    >
      <div className="group flex items-center space-x-1.5">
        <Typography className="font-medium">O</Typography>
        <Typography>{legend.open}</Typography>
        <Typography className="font-medium">H</Typography>
        <Typography>{legend.high}</Typography>
        <Typography className="font-medium">L</Typography>
        <Typography>{legend.low}</Typography>
        <Typography className="font-medium">C</Typography>
        <Typography>{legend.close}</Typography>
        <VisibilityButton hidden={hidden} toggleHidden={handleToggleHidden} />
      </div>
    </Series>
  );
});

const volumeSeriesOptions: DeepPartial<HistogramSeriesOptions & SeriesOptionsCommon> = {
  priceFormat: { type: 'volume' },
  priceScaleId: '',
};
const priceScaleOptionsOfVolumeSeries: DeepPartial<PriceScaleOptions> = {
  scaleMargins: { top: 0.7, bottom: 0 },
};
const VolumeSeries = forwardRef<o.Option<SeriesObj>, { data: HistogramData[] }>(function VolumeSeries(
  { data },
  ref,
) {
  const _series = useSeriesObjRef(ref);
  const [hidden, handleToggleHidden] = useClickToggle(false);
  const { legend, updateLegend } = useSeriesLegend({ data, seriesRef: _series });

  const seriesOptions: DeepPartial<HistogramSeriesOptions & SeriesOptionsCommon> = useMemo(
    () => ({ ...volumeSeriesOptions, visible: !hidden }),
    [hidden],
  );

  return (
    <Series
      ref={_series}
      type="Histogram"
      data={data}
      options={seriesOptions}
      priceScaleOptions={priceScaleOptionsOfVolumeSeries}
      crosshairMoveCb={updateLegend}
    >
      <div className="group flex items-center space-x-1.5">
        <Typography className="font-medium">Vol</Typography>
        <Typography>{legend}</Typography>
        <VisibilityButton hidden={hidden} toggleHidden={handleToggleHidden} />
      </div>
    </Series>
  );
});
