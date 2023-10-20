import * as e from 'fp-ts/lib/Either';
import * as o from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/function';
import {
  AreaData,
  AreaStyleOptions,
  BarData,
  BarStyleOptions,
  BaselineData,
  BaselineStyleOptions,
  CandlestickData,
  CandlestickStyleOptions,
  DeepPartial,
  HistogramData,
  HistogramStyleOptions,
  ISeriesApi,
  LineData,
  LineStyleOptions,
  MouseEventHandler,
  PriceScaleOptions,
  SeriesOptionsCommon,
  Time,
  WhitespaceData,
} from 'lightweight-charts';
import {
  PropsWithChildren,
  forwardRef,
  useContext,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from 'react';

import { ChartContext } from './ChartContainer';

export type SeriesApi = ISeriesApi<'Candlestick' | 'Area' | 'Bar' | 'Baseline' | 'Histogram' | 'Line'>;
export type SeriesObj = { getSeries: () => e.Either<string, SeriesApi>; removeSeries: () => void };
export type SeriesProps = PropsWithChildren<
  (
    | {
        type: 'Candlestick';
        options?: DeepPartial<CandlestickStyleOptions & SeriesOptionsCommon>;
        data: (CandlestickData | WhitespaceData)[];
      }
    | {
        type: 'Area';
        options?: DeepPartial<AreaStyleOptions & SeriesOptionsCommon>;
        data: (AreaData | WhitespaceData)[];
      }
    | {
        type: 'Bar';
        options?: DeepPartial<BarStyleOptions & SeriesOptionsCommon>;
        data: (BarData | WhitespaceData)[];
      }
    | {
        type: 'Baseline';
        options?: DeepPartial<BaselineStyleOptions & SeriesOptionsCommon>;
        data: (BaselineData | WhitespaceData)[];
      }
    | {
        type: 'Histogram';
        options?: DeepPartial<HistogramStyleOptions & SeriesOptionsCommon>;
        data: (HistogramData | WhitespaceData)[];
      }
    | {
        type: 'Line';
        options?: DeepPartial<LineStyleOptions & SeriesOptionsCommon>;
        data: (LineData | WhitespaceData)[];
      }
  ) & { priceScaleOptions?: DeepPartial<PriceScaleOptions>; crosshairMoveCb?: MouseEventHandler<Time> }
>;

export const Series = forwardRef<o.Option<SeriesObj>, SeriesProps>(function Series(props, ref) {
  const { children, type, options, priceScaleOptions, crosshairMoveCb, data } = props;

  const _parentChart = useContext(ChartContext);
  const _series = useRef<o.Option<SeriesApi>>(o.none);

  const seriesObj = useRef<SeriesObj>({
    getSeries() {
      if (o.isNone(_parentChart)) {
        return e.left(
          'Parent chart is none. Please make sure that the series is used inside ChartContainer component',
        );
      } else if (o.isSome(_series.current)) {
        return e.right(_series.current.value);
      }

      const chart = _parentChart.value;
      const series = chart.addSeries(type, options, crosshairMoveCb);

      if (priceScaleOptions) series.priceScale().applyOptions(priceScaleOptions);

      _series.current = o.some(series);

      return e.right(series);
    },
    removeSeries() {
      if (o.isNone(_parentChart) || o.isNone(_series.current)) return;

      _parentChart.value.removeSeries(_series.current.value, crosshairMoveCb);
      _series.current = o.none;
    },
  });
  useImperativeHandle(ref, () => o.some(seriesObj.current), []);

  useLayoutEffect(() => {
    seriesObj.current.getSeries();

    return seriesObj.current.removeSeries;
  }, []);

  useLayoutEffect(() => {
    if (options)
      pipe(
        _series.current,
        o.map((series) => series.applyOptions(options)),
      );
  }, [options]);

  useLayoutEffect(() => {
    pipe(
      _series.current,
      o.map((series) => series.setData(data)),
    );
  }, [data]);

  return <>{children}</>;
});
