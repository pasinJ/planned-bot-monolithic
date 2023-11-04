import * as o from 'fp-ts/lib/Option';
import { LogicalRangeChangeEventHandler, MouseEventHandler, Time, UTCTimestamp } from 'lightweight-charts';
import { PropsWithChildren, useMemo, useRef } from 'react';

import { ChartObj } from './ChartContainer';
import { ChartGroupContext } from './ChartGroupContext';
import { isMouseInDataRange } from './utils';

export type ChartGroupObj = {
  addChart: (chartId: string, chartObj: ChartObj) => void;
  removeChart: (chartId: string) => void;
};

type ChartGroupProps = PropsWithChildren<{ syncTimeScale?: boolean; syncCrosshairMove?: boolean }>;

export default function ChartGroup(props: ChartGroupProps) {
  const { children, syncCrosshairMove, syncTimeScale } = props;

  const childrenCharts = useRef<Map<string, ChartObj>>(new Map());
  const chartGroupObj = useRef<ChartGroupObj>({
    addChart(chartId, chartObj) {
      const chart = chartObj.getChart();
      if (syncCrosshairMove ?? true) {
        chart.subscribeCrosshairMove(handleCrosshairMove);
      }
      if (syncTimeScale ?? true) {
        chart.timeScale().subscribeVisibleLogicalRangeChange(handleTimeScaleChange(chartId));
      }

      childrenCharts.current.set(chartId, chartObj);
    },
    removeChart(chartId) {
      return childrenCharts.current.delete(chartId);
    },
  });

  const handleTimeScaleChange = (chartId: string): LogicalRangeChangeEventHandler => {
    return (timeRange) => {
      if (timeRange !== null) {
        childrenCharts.current.forEach((chartObj, key) => {
          if (key !== chartId) chartObj.getChart().timeScale().setVisibleLogicalRange(timeRange);
        });
      }
    };
  };
  const handleCrosshairMove: MouseEventHandler<Time> = ({ point, time }) => {
    childrenCharts.current.forEach((chartObj) => {
      if (isMouseInDataRange(time)) {
        chartObj.setVerticalCrosshairPosition(point, time as UTCTimestamp);
      } else {
        chartObj.setVerticalCrosshairPosition(point, time);
        chartObj.getChart().clearCrosshairPosition();
      }
    });
  };

  const contextValue = useMemo(() => o.some(chartGroupObj.current), []);
  return <ChartGroupContext.Provider value={contextValue}>{children}</ChartGroupContext.Provider>;
}
