import { ReadonlyNonEmptyArray } from 'fp-ts/lib/ReadonlyNonEmptyArray.js';

import { TimezoneString } from '#shared/utils/string.js';

import { Kline } from '../kline.js';
import { buildKlinesModule } from './klines.js';

describe('UUT: Klines module', () => {
  const timezone = '+07:00' as TimezoneString;
  const klines: ReadonlyNonEmptyArray<Kline> = [
    {
      exchange: 'BINANCE',
      symbol: 'TLBLXY',
      timeframe: '6h',
      openTimestamp: new Date('2022-08-17T12:00:00.000Z'),
      closeTimestamp: new Date('2023-01-06T13:00:00.000Z'),
      open: 6.75213607,
      close: 9.78052325,
      high: 3.07027575,
      low: 2.51088782,
      volume: 1.13656876,
      quoteAssetVolume: 0.94689676,
      takerBuyBaseAssetVolume: 1.47915369,
      takerBuyQuoteAssetVolume: 2.74527246,
      numTrades: 3,
    } as Kline,
    {
      exchange: 'BINANCE',
      symbol: 'GMJQGC',
      timeframe: '1M',
      openTimestamp: new Date('2021-12-18T12:00:00.000Z'),
      closeTimestamp: new Date('2022-11-17T13:00:00.000Z'),
      open: 4.19985283,
      close: 10.87133466,
      high: 1.07215021,
      low: 8.19693358,
      volume: 10.46051105,
      quoteAssetVolume: 3.50282693,
      takerBuyBaseAssetVolume: 10.72053248,
      takerBuyQuoteAssetVolume: 4.42465542,
      numTrades: 9,
    } as Kline,
    {
      exchange: 'BINANCE',
      symbol: 'USVRWX',
      timeframe: '15m',
      openTimestamp: new Date('2023-04-29T12:00:00.000Z'),
      closeTimestamp: new Date('2023-07-29T13:00:00.000Z'),
      open: 3.27095175,
      close: 4.76088427,
      high: 1.16802319,
      low: 8.41574645,
      volume: 9.67130235,
      quoteAssetVolume: 6.32975036,
      takerBuyBaseAssetVolume: 0.73353298,
      takerBuyQuoteAssetVolume: 3.50553614,
      numTrades: 7,
    } as Kline,
  ];
  const klinesModules = buildKlinesModule(klines, timezone);

  describe('[WHEN] get open timestamp property', () => {
    it('[THEN] it will return open timestamp of the last kline of in given timezone', () => {
      const result = klinesModules.openTimestamp;

      expect(result).toEqual(new Date('2023-04-29T19:00:00.000Z'));
    });
  });

  describe('[WHEN] get close timestamp property', () => {
    it('[THEN] it will return close timestamp of the last kline of in given timezone', () => {
      const result = klinesModules.closeTimestamp;

      expect(result).toEqual(new Date('2023-07-29T20:00:00.000Z'));
    });
  });

  describe('[WHEN] get open property', () => {
    it('[THEN] it will return open price of the last kline', () => {
      const result = klinesModules.open;

      expect(result).toBe(3.27095175);
    });
  });

  describe('[WHEN] get high property', () => {
    it('[THEN] it will return high price of the last kline', () => {
      const result = klinesModules.high;

      expect(result).toBe(1.16802319);
    });
  });

  describe('[WHEN] get low property', () => {
    it('[THEN] it will return open price of the last kline', () => {
      const result = klinesModules.low;

      expect(result).toBe(8.41574645);
    });
  });

  describe('[WHEN] get close property', () => {
    it('[THEN] it will return open price of the last kline', () => {
      const result = klinesModules.close;

      expect(result).toBe(4.76088427);
    });
  });

  describe('[WHEN] get volume property', () => {
    it('[THEN] it will return volume of the last kline', () => {
      const result = klinesModules.volume;

      expect(result).toBe(9.67130235);
    });
  });

  describe('[WHEN] get quote asset volume property', () => {
    it('[THEN] it will return quote asset volume of the last kline', () => {
      const result = klinesModules.quoteAssetVolume;

      expect(result).toBe(6.32975036);
    });
  });

  describe('[WHEN] get taker buy base asset volume property', () => {
    it('[THEN] it will return taker buy base asset volume of the last kline', () => {
      const result = klinesModules.takerBuyBaseAssetVolume;

      expect(result).toBe(0.73353298);
    });
  });

  describe('[WHEN] get taker buy quote asset volume property', () => {
    it('[THEN] it will return taker buy quote asset volume of the last kline', () => {
      const result = klinesModules.takerBuyQuoteAssetVolume;

      expect(result).toBe(3.50553614);
    });
  });

  describe('[WHEN] get number of trades property', () => {
    it('[THEN] it will return number of trades of the last kline', () => {
      const result = klinesModules.numTrades;

      expect(result).toBe(7);
    });
  });

  describe('[WHEN] get raw property', () => {
    it('[THEN] it will return the whole kline model of the last kline', () => {
      const result = klinesModules.raw;

      expect(result).toEqual(klines.at(-1));
    });
  });

  describe('[WHEN] get all open price', () => {
    it('[THEN] it will return an array of open price', () => {
      const result = klinesModules.getAllOpen();

      expect(result).toEqual([6.75213607, 4.19985283, 3.27095175]);
    });
  });

  describe('[WHEN] get all close price', () => {
    it('[THEN] it will return an array of close price', () => {
      const result = klinesModules.getAllClose();

      expect(result).toEqual([9.78052325, 10.87133466, 4.76088427]);
    });
  });

  describe('[WHEN] get all high price', () => {
    it('[THEN] it will return an array of high price', () => {
      const result = klinesModules.getAllHigh();

      expect(result).toEqual([3.07027575, 1.07215021, 1.16802319]);
    });
  });

  describe('[WHEN] get all low price', () => {
    it('[THEN] it will return an array of low price', () => {
      const result = klinesModules.getAllLow();

      expect(result).toEqual([2.51088782, 8.19693358, 8.41574645]);
    });
  });

  describe('[WHEN] get all volume', () => {
    it('[THEN] it will return an array of volume', () => {
      const result = klinesModules.getAllVolume();

      expect(result).toEqual([1.13656876, 10.46051105, 9.67130235]);
    });
  });

  describe('[WHEN] get all quote asset volume', () => {
    it('[THEN] it will return an array of quote asset volume', () => {
      const result = klinesModules.getAllQuoteAssetVolume();

      expect(result).toEqual([0.94689676, 3.50282693, 6.32975036]);
    });
  });

  describe('[WHEN] get all taker buy base asset volume', () => {
    it('[THEN] it will return an array of taker buy base asset volume', () => {
      const result = klinesModules.getAllTakerBuyBaseAssetVolume();

      expect(result).toEqual([1.47915369, 10.72053248, 0.73353298]);
    });
  });

  describe('[WHEN] get all taker buy quote asset volume', () => {
    it('[THEN] it will return an array of taker buy quote asset volume', () => {
      const result = klinesModules.getAllTakerBuyQuoteAssetVolume();

      expect(result).toEqual([2.74527246, 4.42465542, 3.50553614]);
    });
  });

  describe('[WHEN] get all number of trades', () => {
    it('[THEN] it will return an array of number of trades', () => {
      const result = klinesModules.getAllNumTrades();

      expect(result).toEqual([3, 9, 7]);
    });
  });

  describe('[WHEN] get all raw kline models', () => {
    it('[THEN] it will return an array of kline models', () => {
      const result = klinesModules.getAllRaw();

      expect(result).toEqual(klines);
    });
  });
});
