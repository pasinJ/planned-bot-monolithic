import Typography from '@mui/material/Typography';
import * as e from 'fp-ts/lib/Either';
import * as o from 'fp-ts/lib/Option';
import { evolve, is, pathEq, pick } from 'ramda';
import { useCallback, useContext, useLayoutEffect, useState } from 'react';

import { CrosshairCallbacks } from '../ChartContainer';
import { ChartContext } from '../ChartContext';
import { isBarOrCandleStickData, isMouseInDataRange, isMouseOffChart } from '../utils';
import { SeriesApi } from './Series';
import { SeriesContext } from './SeriesContext';

type SeriesValueProps = {
  formatValue?: ((val: number) => string) | ((val: number) => number);
  defaultValue?: number | { open: number; high: number; low: number; close: number };
};

export default function SeriesValue(props: SeriesValueProps) {
  const { formatValue, defaultValue } = props;

  const parentChart = useContext(ChartContext);
  const parentSeries = useContext(SeriesContext);
  const [value, setValue] = useState<
    null | number | { open: number; high: number; low: number; close: number }
  >(null);

  const createCrosshairMoveHandler = useCallback(
    (series: SeriesApi): CrosshairCallbacks => {
      return (point, time) => {
        if (!isMouseInDataRange(time)) return setValue(null);
        else if (isMouseOffChart(point)) return setValue(defaultValue ?? null);

        const data = series.data().find(pathEq(time, ['time']));
        if (data !== undefined) {
          if (isBarOrCandleStickData(data)) return setValue(pick(['open', 'high', 'low', 'close'], data));
          else if ('value' in data) return setValue(data.value);
          else return setValue(null);
        }
      };
    },
    [defaultValue],
  );

  useLayoutEffect(() => {
    if (o.isSome(parentChart) && o.isSome(parentSeries)) {
      parentChart.value.getChart();
      const series = parentSeries.value.getSeries();

      if (e.isRight(series)) {
        const handler = createCrosshairMoveHandler(series.right);
        parentChart.value.subscribeVerticalCrosshairChange(handler);

        return () => parentChart.value.unsubscribeVerticalCrosshairChange(handler);
      }
    }
  }, [parentChart, parentSeries, createCrosshairMoveHandler]);

  const displayValue = value ?? defaultValue;
  if (displayValue === undefined) {
    return undefined;
  } else if (is(Number, displayValue)) {
    return (
      <Typography>{formatValue ? formatValue(displayValue).toString() : displayValue.toString()}</Typography>
    );
  } else {
    const formattedValue = formatValue
      ? evolve({ open: formatValue, high: formatValue, low: formatValue, close: formatValue }, displayValue)
      : displayValue;
    return (
      <div className="group flex items-center space-x-1.5">
        <Typography className="font-medium">O</Typography>
        <Typography>{formattedValue.open}</Typography>
        <Typography className="font-medium">H</Typography>
        <Typography>{formattedValue.high}</Typography>
        <Typography className="font-medium">L</Typography>
        <Typography>{formattedValue.low}</Typography>
        <Typography className="font-medium">C</Typography>
        <Typography>{formattedValue.close}</Typography>
      </div>
    );
  }
}
