import Typography from '@mui/material/Typography';
import * as o from 'fp-ts/lib/Option';
import { MouseEventHandler, Time, UTCTimestamp } from 'lightweight-charts';
import { useCallback, useContext, useLayoutEffect, useState } from 'react';

import { isMouseInDataRange, isMouseOffChart } from '../utils';
import { ChartContext } from './ChartContainer';

const toolTipWidth = 200;
const toolTipHeight = 80;
const toolTipMargin = 10;

type TooltipProps = { events: Map<UTCTimestamp, string[]> };

export default function ChartTooltip(props: TooltipProps) {
  const { events } = props;

  const chart = useContext(ChartContext);
  const [tooltipTexts, setTooltipTexts] = useState<string[]>([]);
  const [tooltipDisplay, setTooltipDisplay] = useState<'none' | 'block'>('none');
  const [tooltipPosition, setTooltipPosition] = useState<{ left: number; top: number }>({
    left: 0,
    top: 0,
  });

  const updateTooltip = useCallback(
    (chartContainer: HTMLDivElement): MouseEventHandler<Time> =>
      (param) => {
        const point = param.point;
        const time = param.time as UTCTimestamp;

        if (
          isMouseOffChart(point) ||
          !isMouseInDataRange(time) ||
          point.x < 0 ||
          point.x > chartContainer.clientWidth ||
          point.y < 0 ||
          point.y > chartContainer.clientHeight
        ) {
          return setTooltipDisplay('none');
        }

        const eventTexts = events.get(time);
        if (eventTexts === undefined) {
          return setTooltipDisplay('none');
        }

        let left = point.x + toolTipMargin;
        if (left > chartContainer.clientWidth - toolTipWidth) {
          left = point.x - toolTipMargin - toolTipWidth;
        }

        let top = point.y + toolTipMargin;
        if (top > chartContainer.clientHeight - toolTipHeight) {
          top = point.y - toolTipHeight - toolTipMargin;
        }

        setTooltipTexts(eventTexts);
        setTooltipDisplay('block');
        setTooltipPosition({ left, top });
      },
    [events],
  );

  useLayoutEffect(() => {
    if (o.isSome(chart)) {
      const chartApi = chart.value.getChart();
      const crossHairCallback = updateTooltip(chartApi.chartElement());
      chartApi.subscribeCrosshairMove(crossHairCallback);

      return () => chartApi.unsubscribeCrosshairMove(crossHairCallback);
    }
  }, [chart, updateTooltip]);

  return (
    <div
      className="absolute z-20 bg-surface-2 p-3 shadow-4"
      style={{
        display: tooltipDisplay,
        left: tooltipPosition.left + 'px',
        top: tooltipPosition.top + 'px',
      }}
    >
      {tooltipTexts.map((val, index) => (
        <Typography key={index} variant="body2">
          {val}
        </Typography>
      ))}
    </div>
  );
}
