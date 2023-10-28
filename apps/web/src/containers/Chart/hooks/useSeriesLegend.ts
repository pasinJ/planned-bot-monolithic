import * as e from 'fp-ts/lib/Either';
import * as o from 'fp-ts/lib/Option';
import { AreaData, BaselineData, HistogramData, LineData, MouseEventHandler, Time } from 'lightweight-charts';
import { MutableRefObject, useCallback, useState } from 'react';

import { SeriesObj } from '../Series';
import { formatLegendValue, isMouseInDataRange, isMouseOffChart } from '../utils';

type SeriesData = LineData[] | AreaData[] | HistogramData[] | BaselineData[];

export default function useSeriesLegend(props: {
  data: SeriesData | null;
  seriesRef: MutableRefObject<o.Option<SeriesObj>>;
}) {
  const { data, seriesRef } = props;

  const [legend, setLegend] = useState<string>(formatLegendValue(data?.at(-1)?.value));
  const updateLegend: MouseEventHandler<Time> = useCallback(
    (param) => {
      if (o.isNone(seriesRef.current)) return;

      const series = seriesRef.current.value.getSeries();
      if (e.isLeft(series)) {
        setLegend(series.left);
      } else {
        if (isMouseInDataRange(param.time)) {
          const currentBar = param.seriesData.get(series.right) as LineData | null;
          setLegend(formatLegendValue(currentBar?.value));
        } else if (isMouseOffChart(param.point)) {
          setLegend(formatLegendValue(data?.at(-1)?.value));
        } else {
          setLegend('n/a');
        }
      }
    },
    [data],
  );

  return { legend, updateLegend, setLegend };
}
