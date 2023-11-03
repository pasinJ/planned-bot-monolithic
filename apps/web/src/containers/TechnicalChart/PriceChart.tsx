import Typography from '@mui/material/Typography';
import * as o from 'fp-ts/lib/Option';
import {
  CandlestickStyleOptions,
  DeepPartial,
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
import { PropsWithChildren, useMemo } from 'react';

import { Order } from '#features/btStrategies/order';
import { Kline } from '#features/klines/kline';
import useClickToggle from '#hooks/useClickToggle';
import { to4Digits } from '#shared/utils/number';

import Chart, { useChartContainer } from '../Chart';
import VisibilityButton from './components/VisibilityButton';
import { dateToUtcTimestamp, downColor, formatValue, ordersToMarkersAndEvents, upColor } from './utils';

export type PriceChartType = typeof priceChartType;
const priceChartType = 'price';

const defaultChartOptions: DeepPartial<TimeChartOptions> = { height: 500 };

type PriceChartProps = PropsWithChildren<{
  klines: readonly Kline[];
  orders?: readonly Order[];
  options?: DeepPartial<TimeChartOptions>;
  crosshairMoveCb?: MouseEventHandler<Time>;
  logicalRangeChangeCb?: LogicalRangeChangeEventHandler;
  maxDecimalDigits?: number;
}>;
export default function PriceChart(props: PriceChartProps) {
  const { klines, orders, options, crosshairMoveCb, logicalRangeChangeCb, maxDecimalDigits, children } =
    props;

  const { container, handleContainerRef } = useChartContainer();

  const symbol = klines.at(0)?.symbol ?? '???';
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
        <Chart.Container
          id={priceChartType}
          container={container.value}
          options={chartOptions}
          crosshairMoveCb={crosshairMoveCb}
          logicalRangeChangeCb={logicalRangeChangeCb}
        >
          {events ? <Chart.Tooltip events={events} /> : undefined}
          <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-lg">
            <div className="pointer-events-auto flex w-fit space-x-6">
              <Typography className="text-2xl font-medium">{symbol}</Typography>
              <div className="flex flex-col">
                <PriceSeries klines={klines} markers={markers} maxDecimalDigits={maxDecimalDigits} />
                <VolumeSeries klines={klines} />
              </div>
            </div>
            <div className="pointer-events-auto flex max-h-48 w-fit flex-col space-y-1 overflow-auto whitespace-nowrap scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300">
              {children}
            </div>
          </div>
        </Chart.Container>
      )}
    </div>
  );
}

const priceSeriesOption: DeepPartial<CandlestickStyleOptions & SeriesOptionsCommon> = { upColor, downColor };
const priceScaleOptionsOfPriceSeries: DeepPartial<PriceScaleOptions> = {
  scaleMargins: { top: 0.1, bottom: 0.4 },
};
type PriceSeriesProps = {
  klines: readonly Kline[];
  markers?: SeriesMarker<UTCTimestamp>[];
  maxDecimalDigits?: number;
};
function PriceSeries(props: PriceSeriesProps) {
  const { klines, markers, maxDecimalDigits } = props;

  const [hidden, handleToggleHidden] = useClickToggle(false);

  const prices = klines.map(({ openTimestamp, open, high, low, close }) => ({
    time: dateToUtcTimestamp(openTimestamp),
    open,
    high,
    low,
    close,
  }));
  const seriesOptions: DeepPartial<CandlestickStyleOptions & SeriesOptionsCommon> = useMemo(
    () => ({ ...priceSeriesOption, visible: !hidden }),
    [hidden],
  );

  return (
    <Chart.Series
      id="price"
      type="Candlestick"
      data={prices}
      options={seriesOptions}
      markers={markers}
      priceScaleOptions={priceScaleOptionsOfPriceSeries}
    >
      <div className="group flex items-center space-x-1.5">
        <Chart.SeriesValue defaultValue={prices.at(-1)} formatValue={formatValue(4, maxDecimalDigits)} />
        <VisibilityButton hidden={hidden} toggleHidden={handleToggleHidden} />
      </div>
    </Chart.Series>
  );
}

const volumeSeriesOptions: DeepPartial<HistogramSeriesOptions & SeriesOptionsCommon> = {
  priceFormat: { type: 'volume' },
  priceScaleId: '',
};
const priceScaleOptionsOfVolumeSeries: DeepPartial<PriceScaleOptions> = {
  scaleMargins: { top: 0.7, bottom: 0 },
};
function VolumeSeries({ klines }: { klines: readonly Kline[] }) {
  const [hidden, handleToggleHidden] = useClickToggle(false);

  const volumes = klines.map(({ openTimestamp, volume, open, close }) => ({
    time: dateToUtcTimestamp(openTimestamp),
    value: volume,
    color: open > close ? downColor : upColor,
  }));
  const seriesOptions: DeepPartial<HistogramSeriesOptions & SeriesOptionsCommon> = useMemo(
    () => ({ ...volumeSeriesOptions, visible: !hidden }),
    [hidden],
  );

  return (
    <Chart.Series
      id="volume"
      type="Histogram"
      data={volumes}
      options={seriesOptions}
      priceScaleOptions={priceScaleOptionsOfVolumeSeries}
    >
      <div className="group flex items-center space-x-1.5">
        <Typography className="font-medium">Vol</Typography>
        <Chart.SeriesValue defaultValue={volumes.at(-1)?.value} formatValue={to4Digits} />
        <VisibilityButton hidden={hidden} toggleHidden={handleToggleHidden} />
      </div>
    </Chart.Series>
  );
}
