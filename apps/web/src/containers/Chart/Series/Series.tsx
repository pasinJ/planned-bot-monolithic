import * as e from 'fp-ts/lib/Either';
import * as o from 'fp-ts/lib/Option';
import {
  AreaData,
  AreaStyleOptions,
  BarData,
  BarStyleOptions,
  BaselineData,
  BaselineStyleOptions,
  CandlestickData,
  CandlestickStyleOptions,
  CreatePriceLineOptions,
  DeepPartial,
  HistogramData,
  HistogramStyleOptions,
  IPriceLine,
  ISeriesApi,
  LineData,
  LineStyleOptions,
  PriceScaleOptions,
  SeriesMarker,
  SeriesOptionsCommon,
  Time,
  UTCTimestamp,
  WhitespaceData,
} from 'lightweight-charts';
import {
  PropsWithChildren,
  forwardRef,
  useContext,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';

import { ChartContext } from '../ChartContext';
import { SeriesContext } from './SeriesContext';

export type SeriesApi = ISeriesApi<'Candlestick' | 'Area' | 'Bar' | 'Baseline' | 'Histogram' | 'Line'>;

export type SeriesObj = {
  getSeries: () => e.Either<string, SeriesApi>;
  removeSeries: () => void;
  getDataMap: () => Map<
    Time,
    CandlestickData | AreaData | BarData | BaselineData | HistogramData | LineData | WhitespaceData
  >;
};

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
  ) & {
    id: string;
    priceScaleOptions?: DeepPartial<PriceScaleOptions>;
    priceLinesOptions?: (CreatePriceLineOptions & { id: string })[];
    markers?: SeriesMarker<UTCTimestamp>[];
  }
>;

const defaultSeriesOptions: DeepPartial<SeriesOptionsCommon> = { priceFormat: { minMove: 0.00000001 } };

export const Series = forwardRef<SeriesObj, SeriesProps>(function Series(props, ref) {
  const { children, id, type, options, priceScaleOptions, data, priceLinesOptions, markers } = props;

  const parentChart = useContext(ChartContext);

  const _series = useRef<o.Option<SeriesApi>>(o.none);
  const _priceLines = useRef<Map<string, IPriceLine>>(new Map());
  const seriesObj = useRef<SeriesObj>({
    getSeries() {
      if (o.isNone(parentChart)) {
        return e.left(
          'Parent chart is none. Please make sure that the series is used inside ChartContainer component',
        );
      } else if (o.isSome(_series.current)) {
        return e.right(_series.current.value);
      }

      const chart = parentChart.value.getChart();
      const series: SeriesApi =
        type === 'Candlestick'
          ? chart.addCandlestickSeries(options)
          : type === 'Area'
          ? chart.addAreaSeries(options)
          : type === 'Bar'
          ? chart.addBarSeries(options)
          : type === 'Baseline'
          ? chart.addBaselineSeries(options)
          : type === 'Histogram'
          ? chart.addHistogramSeries(options)
          : chart.addLineSeries(options);

      parentChart.value.addSeries(id, series);

      _series.current = o.some(series);
      _priceLines.current = new Map();

      return e.right(series);
    },
    removeSeries() {
      if (o.isSome(parentChart) && o.isSome(_series.current)) {
        parentChart.value.removeSeries(id);
        _series.current = o.none;
        _priceLines.current = new Map();
      }
    },
    getDataMap() {
      return new Map(data.map((x) => [x.time, x]));
    },
  });

  useImperativeHandle(ref, () => seriesObj.current, []);

  useLayoutEffect(() => {
    seriesObj.current.getSeries();

    return seriesObj.current.removeSeries;
  }, []);

  useLayoutEffect(() => {
    if (options && o.isSome(_series.current)) {
      _series.current.value.applyOptions({ ...defaultSeriesOptions, ...options });
    }
  }, [options]);

  useLayoutEffect(() => {
    if (priceScaleOptions && o.isSome(_series.current)) {
      _series.current.value.priceScale().applyOptions(priceScaleOptions);
    }
  }, [priceScaleOptions]);

  useLayoutEffect(() => {
    if (priceLinesOptions && o.isSome(_series.current)) {
      const series = _series.current.value;
      const prevPriceLines = _priceLines.current;
      const newPriceLines = new Map<string, IPriceLine>();

      priceLinesOptions.forEach((options) => {
        const priceLine = prevPriceLines.get(options.id) ?? series.createPriceLine(options);

        if (prevPriceLines.has(options.id)) priceLine.applyOptions(options);

        newPriceLines.set(options.id, priceLine);
        prevPriceLines.delete(options.id);
      });
      prevPriceLines.forEach((priceLine) => series.removePriceLine(priceLine));

      _priceLines.current = newPriceLines;
    }
  }, [priceLinesOptions]);

  useLayoutEffect(() => {
    if (markers && o.isSome(_series.current)) {
      _series.current.value.setMarkers(markers);
    }
  }, [markers]);

  useLayoutEffect(() => {
    if (o.isSome(_series.current)) {
      _series.current.value.setData(data);
    }
  }, [data]);

  const contextValue = useMemo(() => o.some(seriesObj.current), []);
  return <SeriesContext.Provider value={contextValue}>{children}</SeriesContext.Provider>;
});
