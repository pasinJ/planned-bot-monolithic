import { getUnixTime, isAfter, isBefore, isEqual } from 'date-fns';
import { SeriesMarker, UTCTimestamp } from 'lightweight-charts';
import material from 'material-colors';
import { append, ascend, groupBy, prop, sort, toPairs } from 'ramda';

import { Order } from '#features/btStrategies/order';
import { Kline } from '#features/klines/kline';
import { HexColor } from '#shared/utils/string';

export type Source = 'open' | 'high' | 'low' | 'close';
export const sourcesList: Source[] = ['open', 'high', 'low', 'close'];

export const upColor = '#26A69A' as HexColor;
export const downColor = '#EF5350' as HexColor;
export const markerColor = '#f7c82d' as HexColor;

export function ordersToMarkersAndEvents(
  klines: readonly Kline[],
  orders: readonly Order[],
): { markers: SeriesMarker<UTCTimestamp>[]; events: Map<UTCTimestamp, string[]> } {
  const orderEvents = orders.flatMap((order) =>
    order.status === 'REJECTED'
      ? { time: order.submittedAt, text: `${order.type} order (${order.id}) was rejected` }
      : order.status === 'CANCELED'
      ? [
          { time: order.submittedAt, text: `${order.type} order (${order.id}) was submitted` },
          { time: order.canceledAt, text: `${order.type} order (${order.id}) was canceled` },
        ]
      : order.status === 'FILLED'
      ? isEqual(order.submittedAt, order.filledAt)
        ? {
            time: order.submittedAt,
            text: `${order.type} order (${order.id}) was submitted and filled at price ${order.filledPrice}`,
          }
        : [
            { time: order.submittedAt, text: `${order.type} order (${order.id}) was submitted` },
            {
              time: order.filledAt,
              text: `${order.type} order (${order.id}) was filled at price ${order.filledPrice}`,
            },
          ]
      : { time: order.submittedAt, text: `${order.type} order (${order.id}) was submitted` },
  );
  const groupedOrderEvents = groupBy((event) => event.time.toISOString(), orderEvents);

  const { markers, events } = toPairs(groupedOrderEvents).reduce(
    ({ markers, events }, [time, event]) => {
      if (event === undefined) return { markers, events };

      const eventDate = new Date(time);
      const matchKlineIndex = klines.findIndex(
        (kline) => !isBefore(eventDate, kline.openTimestamp) && !isAfter(eventDate, kline.closeTimestamp),
      );
      const marker: SeriesMarker<UTCTimestamp> | undefined =
        matchKlineIndex !== -1
          ? {
              time: getUnixTime(klines[matchKlineIndex].openTimestamp) as UTCTimestamp,
              position: matchKlineIndex % 2 === 0 ? 'aboveBar' : 'belowBar',
              color: markerColor,
              shape: 'circle',
              size: 2,
            }
          : undefined;

      return {
        markers: marker ? append(marker, markers) : markers,
        events: marker ? events.set(marker.time, event.map(prop('text'))) : events,
      };
    },
    { markers: [] as SeriesMarker<UTCTimestamp>[], events: new Map() as Map<UTCTimestamp, string[]> },
  );

  return { markers: sort(ascend(prop('time')), markers), events };
}

export function dateToUtcTimestamp(date: Date): UTCTimestamp {
  return getUnixTime(date) as UTCTimestamp;
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
