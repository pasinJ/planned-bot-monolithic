import { exchangeNameEnum } from '#features/shared/exchange.js';
import { SymbolName } from '#features/shared/symbol.js';
import { timeframeEnum } from '#features/shared/timeframe.js';
import { isGeneralError } from '#shared/errors/generalError.js';

import { transformCsvRowToKline } from './transformCsvRowToKline.js';

describe('[GIVEN] the row is a valid kline data', () => {
  describe('[WHEN] transform CSV row to kline', () => {
    it('[THEN] it will return Right of kline', () => {
      const request = {
        exchange: exchangeNameEnum.BINANCE,
        symbol: 'BNBUSDT' as SymbolName,
        timeframe: timeframeEnum['2h'],
      };
      const row = [
        '1694935443000',
        '26545.37000000',
        '26545.37000000',
        '26545.37000000',
        '26545.37000000',
        '0.00000000',
        '1694935443999',
        '0.00000000',
        '0',
        '0.00000000',
        '0.00000000',
        '0',
      ];

      const result = transformCsvRowToKline(request)(row);

      expect(result).toEqualRight({
        exchange: exchangeNameEnum.BINANCE,
        symbol: 'BNBUSDT',
        timeframe: timeframeEnum['2h'],
        openTimestamp: new Date(1694935443000),
        closeTimestamp: new Date(1694935443999),
        open: 26545.37,
        close: 26545.37,
        high: 26545.37,
        low: 26545.37,
        volume: 0.0,
        quoteAssetVolume: 0.0,
        takerBuyBaseAssetVolume: 0.0,
        takerBuyQuoteAssetVolume: 0.0,
        numTrades: 0,
      });
    });
  });
});

describe('[GIVEN] the row is an invalid kline data', () => {
  describe('[WHEN] transform CSV row to kline', () => {
    it('[THEN] it will return Left of error', () => {
      const request = {
        exchange: exchangeNameEnum.BINANCE,
        symbol: 'BNBUSDT' as SymbolName,
        timeframe: timeframeEnum['2h'],
      };
      const row = ['wrong'];

      const result = transformCsvRowToKline(request)(row);

      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
  });
});
