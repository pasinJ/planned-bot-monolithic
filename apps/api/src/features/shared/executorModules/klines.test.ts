import { utcToZonedTime } from 'date-fns-tz';
import { last } from 'fp-ts/lib/ReadonlyNonEmptyArray.js';
import { prop } from 'ramda';

import { randomTimezone } from '#test-utils/faker/date.js';
import { generateArrayOf } from '#test-utils/faker/helper.js';
import { mockKline } from '#test-utils/features/btStrategies/models.js';

import { buildKlinesModule } from './klines.js';

describe('UUT: Klines module', () => {
  const timezone = randomTimezone();
  const klines = generateArrayOf(mockKline);
  const klinesModules = buildKlinesModule(klines, timezone);

  describe('[WHEN] get open timestamp property', () => {
    it('[THEN] it will return open timestamp of the last kline of in given timezone', () => {
      const result = klinesModules.openTimestamp;

      const expected = utcToZonedTime(last(klines).openTimestamp, timezone);
      expect(result).toEqual(expected);
    });
  });

  describe('[WHEN] get close timestamp property', () => {
    it('[THEN] it will return close timestamp of the last kline of in given timezone', () => {
      const result = klinesModules.closeTimestamp;

      const expected = utcToZonedTime(last(klines).closeTimestamp, timezone);
      expect(result).toEqual(expected);
    });
  });

  describe('[WHEN] get open property', () => {
    it('[THEN] it will return open price of the last kline', () => {
      const result = klinesModules.open;

      expect(result).toEqual(last(klines).open);
    });
  });

  describe('[WHEN] get high property', () => {
    it('[THEN] it will return high price of the last kline', () => {
      const result = klinesModules.high;

      expect(result).toEqual(last(klines).high);
    });
  });

  describe('[WHEN] get low property', () => {
    it('[THEN] it will return open price of the last kline', () => {
      const result = klinesModules.low;

      expect(result).toEqual(last(klines).low);
    });
  });

  describe('[WHEN] get close property', () => {
    it('[THEN] it will return open price of the last kline', () => {
      const result = klinesModules.close;

      expect(result).toEqual(last(klines).close);
    });
  });

  describe('[WHEN] get volume property', () => {
    it('[THEN] it will return volume of the last kline', () => {
      const result = klinesModules.volume;

      expect(result).toEqual(last(klines).volume);
    });
  });

  describe('[WHEN] get quote asset volume property', () => {
    it('[THEN] it will return quote asset volume of the last kline', () => {
      const result = klinesModules.quoteAssetVolume;

      expect(result).toEqual(last(klines).quoteAssetVolume);
    });
  });

  describe('[WHEN] get taker buy base asset volume property', () => {
    it('[THEN] it will return taker buy base asset volume of the last kline', () => {
      const result = klinesModules.takerBuyBaseAssetVolume;

      expect(result).toEqual(last(klines).takerBuyBaseAssetVolume);
    });
  });

  describe('[WHEN] get taker buy quote asset volume property', () => {
    it('[THEN] it will return taker buy quote asset volume of the last kline', () => {
      const result = klinesModules.takerBuyQuoteAssetVolume;

      expect(result).toEqual(last(klines).takerBuyQuoteAssetVolume);
    });
  });

  describe('[WHEN] get number of trades property', () => {
    it('[THEN] it will return number of trades of the last kline', () => {
      const result = klinesModules.numTrades;

      expect(result).toEqual(last(klines).numTrades);
    });
  });

  describe('[WHEN] get raw property', () => {
    it('[THEN] it will return the whole kline model of the last kline', () => {
      const result = klinesModules.raw;

      expect(result).toEqual(last(klines));
    });
  });

  describe('[WHEN] get all open price', () => {
    it('[THEN] it will return an array of open price', () => {
      const result = klinesModules.getAllOpen();

      expect(result).toEqual(klines.map(prop('open')));
    });
  });

  describe('[WHEN] get all close price', () => {
    it('[THEN] it will return an array of close price', () => {
      const result = klinesModules.getAllClose();

      expect(result).toEqual(klines.map(prop('close')));
    });
  });

  describe('[WHEN] get all high price', () => {
    it('[THEN] it will return an array of high price', () => {
      const result = klinesModules.getAllHigh();

      expect(result).toEqual(klines.map(prop('high')));
    });
  });

  describe('[WHEN] get all low price', () => {
    it('[THEN] it will return an array of low price', () => {
      const result = klinesModules.getAllLow();

      expect(result).toEqual(klines.map(prop('low')));
    });
  });

  describe('[WHEN] get all volume', () => {
    it('[THEN] it will return an array of volume', () => {
      const result = klinesModules.getAllVolume();

      expect(result).toEqual(klines.map(prop('volume')));
    });
  });

  describe('[WHEN] get all quote asset volume', () => {
    it('[THEN] it will return an array of quote asset volume', () => {
      const result = klinesModules.getAllQuoteAssetVolume();

      expect(result).toEqual(klines.map(prop('quoteAssetVolume')));
    });
  });

  describe('[WHEN] get all taker buy base asset volume', () => {
    it('[THEN] it will return an array of taker buy base asset volume', () => {
      const result = klinesModules.getAllTakerBuyBaseAssetVolume();

      expect(result).toEqual(klines.map(prop('takerBuyBaseAssetVolume')));
    });
  });

  describe('[WHEN] get all taker buy quote asset volume', () => {
    it('[THEN] it will return an array of taker buy quote asset volume', () => {
      const result = klinesModules.getAllTakerBuyQuoteAssetVolume();

      expect(result).toEqual(klines.map(prop('takerBuyQuoteAssetVolume')));
    });
  });

  describe('[WHEN] get all number of trades', () => {
    it('[THEN] it will return an array of number of trades', () => {
      const result = klinesModules.getAllNumTrades();

      expect(result).toEqual(klines.map(prop('numTrades')));
    });
  });

  describe('[WHEN] get all raw kline models', () => {
    it('[THEN] it will return an array of kline models', () => {
      const result = klinesModules.getAllRaw();

      expect(result).toEqual(klines);
    });
  });
});
