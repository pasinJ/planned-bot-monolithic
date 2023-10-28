import * as o from 'fp-ts/lib/Option';
import {
  BarPrice,
  CrosshairMode,
  DeepPartial,
  IChartApi,
  LogicalRangeChangeEventHandler,
  MouseEventHandler,
  SeriesOptionsCommon,
  SeriesType,
  Time,
  TimeChartOptions,
  createChart,
} from 'lightweight-charts';
import { mergeDeepRight } from 'ramda';
import {
  PropsWithChildren,
  createContext,
  forwardRef,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';

import type { SeriesApi } from './Series';

export const ChartContext = createContext<o.Option<ChartObj>>(o.none);
export type ChartObj = {
  getChart: () => IChartApi;
  addSeries: (
    type: SeriesType,
    options?: DeepPartial<SeriesOptionsCommon>,
    crosshairMoveCb?: MouseEventHandler<Time>,
  ) => SeriesApi;
  getSeriesList: () => SeriesApi[];
  removeSeries: (seriesApi: SeriesApi, crosshairMoveCb?: MouseEventHandler<Time>) => void;
  removeChart: () => void;
};

const defaultChartOptions: DeepPartial<TimeChartOptions> = {
  autoSize: true,
  layout: { fontFamily: 'Courier' },
  localization: { priceFormatter: (p: BarPrice) => `${p.toFixed(2).padEnd(10)}` },
  timeScale: { rightOffset: 10 },
  crosshair: { mode: CrosshairMode.Normal },
};

type ChartContainerProps = PropsWithChildren<{
  container: HTMLElement;
  options?: DeepPartial<TimeChartOptions>;
  crosshairMoveCb?: MouseEventHandler<Time>;
  logicalRangeChangeCb?: LogicalRangeChangeEventHandler;
}>;
export const ChartContainer = forwardRef<o.Option<ChartObj>, ChartContainerProps>(
  function ChartContainer(props, ref) {
    const { children, container, options, crosshairMoveCb, logicalRangeChangeCb } = props;

    const chartOptions = useMemo(() => mergeDeepRight(defaultChartOptions, options ?? {}), [options]);

    useImperativeHandle(ref, () => o.some(chartObj.current), []);
    const _chart = useRef<o.Option<IChartApi>>(o.none);
    const _seriesSet = useRef<Set<SeriesApi>>(new Set());
    const chartObj = useRef<ChartObj>({
      getChart() {
        if (o.isSome(_chart.current)) return _chart.current.value;

        const chart = createChart(container, options);
        chart.timeScale().fitContent();

        if (crosshairMoveCb) {
          chart.subscribeCrosshairMove(crosshairMoveCb);
        }
        if (logicalRangeChangeCb) {
          chart.timeScale().subscribeVisibleLogicalRangeChange(logicalRangeChangeCb);
        }

        window.addEventListener('resize', handleResize);

        _chart.current = o.some(chart);
        _seriesSet.current.clear();

        return chart;
      },
      addSeries(type, options, crosshairMoveCb) {
        const chart = chartObj.current.getChart();

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

        if (crosshairMoveCb) {
          chart.subscribeCrosshairMove(crosshairMoveCb);
        }

        _seriesSet.current.add(series);

        return series;
      },
      getSeriesList() {
        return Array.from(_seriesSet.current);
      },
      removeSeries(seriesApi, seriesCrosshairMoveCb) {
        if (o.isNone(_chart.current)) return;

        _chart.current.value.removeSeries(seriesApi);
        _seriesSet.current.delete(seriesApi);

        if (seriesCrosshairMoveCb) {
          _chart.current.value.unsubscribeCrosshairMove(seriesCrosshairMoveCb);
        }
      },
      removeChart() {
        if (o.isNone(_chart.current)) return;

        const chart = _chart.current.value;

        if (crosshairMoveCb) {
          chart.unsubscribeCrosshairMove(crosshairMoveCb);
        }
        if (logicalRangeChangeCb) {
          chart.timeScale().unsubscribeVisibleLogicalRangeChange(logicalRangeChangeCb);
        }

        chart.remove();

        window.removeEventListener('resize', handleResize);

        _chart.current = o.none;
        _seriesSet.current.clear();
      },
    });
    const handleResize = useCallback(() => {
      if (o.isNone(_chart.current)) return;

      _chart.current.value.applyOptions({ ...chartOptions, width: container.clientWidth });
    }, [chartOptions, container.clientWidth]);

    useLayoutEffect(() => {
      chartObj.current.getChart();

      return chartObj.current.removeChart;
    }, []);

    useLayoutEffect(() => {
      chartObj.current.getChart().applyOptions(chartOptions);
    }, [chartOptions]);

    return <ChartContext.Provider value={o.some(chartObj.current)}>{children}</ChartContext.Provider>;
  },
);
