import * as o from 'fp-ts/lib/Option';
import {
  BarPrice,
  CrosshairMode,
  DeepPartial,
  IChartApi,
  LogicalRangeChangeEventHandler,
  MouseEventHandler,
  Point,
  Time,
  TimeChartOptions,
  UTCTimestamp,
  createChart,
} from 'lightweight-charts';
import { mergeDeepRight } from 'ramda';
import {
  PropsWithChildren,
  forwardRef,
  useCallback,
  useContext,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';

import { ChartContext } from './ChartContext';
import { ChartGroupContext } from './ChartGroupContext';
import type { SeriesApi } from './Series';

const defaultChartOptions: DeepPartial<TimeChartOptions> = {
  autoSize: true,
  layout: { fontFamily: 'Courier' },
  localization: { priceFormatter: (p: BarPrice) => `${p.toFixed(2).padEnd(10)}` },
  timeScale: { rightOffset: 10 },
  crosshair: { mode: CrosshairMode.Normal },
};

export type ChartObj = {
  getChart: () => IChartApi;
  removeChart: () => void;
  addSeries: (seriesId: string, seriesApi: SeriesApi) => void;
  removeSeries: (seriesId: string) => void;
  setVerticalCrosshairPosition: (point: Point | undefined, time: UTCTimestamp | undefined) => void;
  subscribeVerticalCrosshairChange: (callback: CrosshairCallbacks) => void;
  unsubscribeVerticalCrosshairChange: (callback: CrosshairCallbacks) => void;
};
export type CrosshairCallbacks = (point: Point | undefined, time: UTCTimestamp | undefined) => void;

type ChartContainerProps = PropsWithChildren<{
  id: string;
  container: HTMLElement;
  options?: DeepPartial<TimeChartOptions>;
  crosshairMoveCb?: MouseEventHandler<Time>;
  logicalRangeChangeCb?: LogicalRangeChangeEventHandler;
}>;

export const ChartContainer = forwardRef<ChartObj, ChartContainerProps>(function ChartContainer(props, ref) {
  const { children, id, container, options, crosshairMoveCb, logicalRangeChangeCb } = props;

  const parentGroup = useContext(ChartGroupContext);

  const _chart = useRef<o.Option<IChartApi>>(o.none);
  const childrenSeries = useRef<Map<string, SeriesApi>>(new Map());
  const crosshairCallbacks = useRef<Set<CrosshairCallbacks>>(new Set());
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
      childrenSeries.current.clear();
      crosshairCallbacks.current.clear();

      if (o.isSome(parentGroup)) parentGroup.value.addChart(id, chartObj.current);

      return chart;
    },
    removeChart() {
      if (o.isSome(_chart.current)) {
        window.removeEventListener('resize', handleResize);

        if (o.isSome(parentGroup)) parentGroup.value.removeChart(id);

        _chart.current.value.remove();
        _chart.current = o.none;
        childrenSeries.current.clear();
        crosshairCallbacks.current.clear();
      }
    },
    addSeries(seriesId, seriesApi) {
      childrenSeries.current.set(seriesId, seriesApi);
    },
    removeSeries(seriesId) {
      if (o.isSome(_chart.current)) {
        const seriesApi = childrenSeries.current.get(seriesId);
        if (seriesApi) {
          _chart.current.value.removeSeries(seriesApi);
          childrenSeries.current.delete(seriesId);
        }
      }
    },
    setVerticalCrosshairPosition(point, time) {
      if (o.isSome(_chart.current) && childrenSeries.current.size > 0) {
        const chart = _chart.current.value;
        const anySeries = Array.from(childrenSeries.current.values())[0];

        if (time !== undefined) chart.setCrosshairPosition(Infinity, time, anySeries);

        crosshairCallbacks.current.forEach((callback) => callback(point, time));
      }
    },
    subscribeVerticalCrosshairChange(callback) {
      return crosshairCallbacks.current.add(callback);
    },
    unsubscribeVerticalCrosshairChange(callback) {
      return crosshairCallbacks.current.delete(callback);
    },
  });

  const handleResize = useCallback(() => {
    if (o.isSome(_chart.current)) {
      const currentOptions = _chart.current.value.options();
      _chart.current.value.applyOptions({ ...currentOptions, width: container.clientWidth });
    }
  }, [container.clientWidth]);

  useImperativeHandle(ref, () => chartObj.current, []);

  useLayoutEffect(() => {
    chartObj.current.getChart();

    return chartObj.current.removeChart;
  }, []);

  const chartOptions = useMemo(() => mergeDeepRight(defaultChartOptions, options ?? {}), [options]);
  useLayoutEffect(() => {
    chartObj.current.getChart().applyOptions(chartOptions);
  }, [chartOptions]);

  const contextValue = useMemo(() => o.some(chartObj.current), []);
  return <ChartContext.Provider value={contextValue}>{children}</ChartContext.Provider>;
});
