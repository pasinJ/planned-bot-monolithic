import { Decimal } from 'decimal.js';
import { prop, take } from 'ramda';

import { mockKline } from '#test-utils/features/btStrategies/models.js';

import { bb, bbw, pvt, supertrend } from './indicators.js';

const klines = [
  { open: 0.02829166, high: 0.0335163, low: 0.02555602, close: 0.02849322, volume: 367958.01075971 },
  { open: 0.02849322, high: 1.73300963, low: 0.00995947, close: 0.06040588, volume: 1066026.93741542 },
  { open: 0.06040588, high: 0.16370064, low: 0.06032018, close: 0.16370064, volume: 1184702.80296986 },
  { open: 0.16370064, high: 0.22812467, low: 0.16370064, close: 0.18349284, volume: 605755.4295319 },
  { open: 0.18349284, high: 0.18488014, low: 0.1037553, close: 0.1037553, volume: 342790.68143546 },
  { open: 0.1037553, high: 0.1383147, low: 0.0832528, close: 0.12387333, volume: 592168.60218012 },
  { open: 0.12387333, high: 0.13050992, low: 0.04625189, close: 0.10025481, volume: 871726.30358852 },
  { open: 0.10025481, high: 0.10900066, low: 0.0956119, close: 0.10708829, volume: 172808.44191808 },
  { open: 0.10708829, high: 0.15266737, low: 0.10273907, close: 0.1374216, volume: 198431.02289826 },
  { open: 0.1374216, high: 0.14373031, low: 0.1215121, close: 0.13998748, volume: 171559.41736608 },
  { open: 0.13998748, high: 0.16457264, low: 0.13998748, close: 0.16137744, volume: 60386.20032267 },
  { open: 0.16137744, high: 0.18354999, low: 0.16048733, close: 0.17695433, volume: 88229.70912985 },
  { open: 0.17695433, high: 0.19297739, low: 0.17695433, close: 0.1849262, volume: 70106.59373628 },
  { open: 0.1849262, high: 0.199576, low: 0.18077713, close: 0.19167473, volume: 76367.35125735 },
  { open: 0.19167473, high: 0.19785863, low: 0.17677882, close: 0.18965992, volume: 68000.68980066 },
].map((val) => mockKline(val));

describe('UUT: Supertrend', () => {
  describe('[WHEN] calculate supertrend', () => {
    it('[THEN] it will return a correct value', async () => {
      const result = await supertrend(klines, 3, 10);

      const expected = {
        supertrend: [
          0,
          NaN,
          NaN,
          NaN,
          NaN,
          NaN,
          NaN,
          NaN,
          NaN,
          0.794059696,
          0.7549502499,
          0.7213406289,
          0.68416255,
          0.645093247,
          0.6030676818,
        ],
        direction: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      };
      expect(result.supertrend.map((val) => new Decimal(val).toDecimalPlaces(10).toNumber())).toEqual(
        expected.supertrend,
      );
      expect(result.direction).toEqual(expected.direction);
    });
  });
});

describe('Price-volume trend', () => {
  describe('[WHEN] calculate price-volume trend', () => {
    it('[THEN] it will return a correct value', () => {
      const result = pvt(take(10, klines));

      const expected = [
        NaN,
        1193959.6579319423,
        3219815.281657629,
        3293054.046102174,
        3144092.998507144,
        3258913.79034831,
        3092704.6060482548,
        3104483.4227621695,
        3160690.032571608,
        3163893.3199575157,
      ];
      expect(result.map((val) => new Decimal(val).toDecimalPlaces(10).toNumber())).toEqual(expected);
    });
  });
});

describe('Bollinger Bands Width', () => {
  describe('[WHEN] calculate price-volume trend', () => {
    it('[THEN] it will return a correct value', async () => {
      const close = klines.map(prop('close'));
      const result = bbw(await bb(close, 5, 4));

      const expected = [
        NaN,
        NaN,
        NaN,
        NaN,
        4.3717615275,
        2.7481323735,
        1.9620621822,
        2.0036359475,
        0.981619351,
        1.0431858621,
        1.3969893854,
        1.3114577964,
        0.9533691547,
        0.8655668405,
        0.4867034707,
      ];
      expect(result.map((val) => new Decimal(val).toDecimalPlaces(10).toNumber())).toEqual(expected);
    });
  });
});
