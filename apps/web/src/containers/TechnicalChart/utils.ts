import { getUnixTime } from 'date-fns';
import { Decimal } from 'decimal.js';
import { MouseEventParams, Time, UTCTimestamp } from 'lightweight-charts';
import material from 'material-colors';

import { HexColor } from '#shared/utils/string';
import { isString } from '#shared/utils/typeGuards';

export type Source = 'open' | 'high' | 'low' | 'close';
export const sourcesList: Source[] = ['open', 'high', 'low', 'close'];

export const upColor = '#26A69A' as HexColor;
export const downColor = '#EF5350' as HexColor;

export function formatLegend(value: string | number | undefined): string {
  if (isString(value)) return value;
  else if (value === undefined) return 'n/a';
  else return new Decimal(value).toDecimalPlaces(3, Decimal.ROUND_HALF_UP).toString();
}

export function dateToUtcTimestamp(date: Date): UTCTimestamp {
  return getUnixTime(date) as UTCTimestamp;
}

export function isMouseInDataRange(time: Time | undefined): time is Time {
  return time !== undefined;
}
export function isMouseOffChart(param: MouseEventParams): boolean {
  return param.point === undefined;
}

const colorPreset: HexColor[] = [
  material.red['900'],
  material.red['700'],
  material.red['500'],
  material.pink['900'],
  material.pink['700'],
  material.pink['500'],
  material.purple['900'],
  material.purple['700'],
  material.purple['500'],
  material.deepPurple['900'],
  material.deepPurple['700'],
  material.deepPurple['500'],
  material.indigo['900'],
  material.indigo['700'],
  material.indigo['500'],
  material.blue['900'],
  material.blue['700'],
  material.blue['500'],
  material.lightBlue['900'],
  material.lightBlue['700'],
  material.lightBlue['500'],
  material.cyan['900'],
  material.cyan['700'],
  material.cyan['500'],
  material.teal['900'],
  material.teal['700'],
  material.teal['500'],
  '#194D33',
  material.green['700'],
  material.green['500'],
  material.lightGreen['900'],
  material.lightGreen['700'],
  material.lightGreen['500'],
  material.lime['900'],
  material.lime['700'],
  material.lime['500'],
  material.yellow['900'],
  material.yellow['700'],
  material.yellow['500'],
  material.amber['900'],
  material.amber['700'],
  material.amber['500'],
  material.orange['900'],
  material.orange['700'],
  material.orange['500'],
  material.deepOrange['900'],
  material.deepOrange['700'],
  material.deepOrange['500'],
  material.brown['900'],
  material.brown['700'],
  material.brown['500'],
  material.blueGrey['900'],
  material.blueGrey['700'],
  material.blueGrey['500'],
  '#525252',
  '#969696',
  '#D9D9D9',
] as HexColor[];
export function randomHexColor(): HexColor {
  return colorPreset[Math.floor(Math.random() * colorPreset.length)];
}
