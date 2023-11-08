import { Decimal } from 'decimal.js';
import {
  BarData,
  CandlestickData,
  MouseEventParams,
  SeriesDataItemTypeMap,
  SeriesType,
  Time,
  UTCTimestamp,
} from 'lightweight-charts';

import { isString } from '#shared/utils/typeGuards';

export function isMouseInDataRange(time: Time | undefined): time is Time {
  return time !== undefined;
}
export function isMouseOffChart(point: MouseEventParams['point']): point is undefined {
  return point === undefined;
}

export function isBarOrCandleStickData(
  data: SeriesDataItemTypeMap[SeriesType],
): data is CandlestickData<UTCTimestamp> | BarData<UTCTimestamp> {
  return 'open' in data;
}

export function formatLegendValue(value: string | number | undefined): string {
  if (isString(value)) return value;
  else if (value === undefined) return 'n/a';
  else return new Decimal(value).toDecimalPlaces(3, Decimal.ROUND_HALF_UP).toString();
}
