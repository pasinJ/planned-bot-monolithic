import { isGeneralError } from '#shared/errors/generalError.js';

import { exchangeNameEnum } from './exchange.js';
import { createKline } from './kline.js';
import { SymbolName } from './symbol.js';
import { timeframeEnum } from './timeframe.js';

describe('UUT: Create kline', () => {
  const validData = {
    exchange: exchangeNameEnum.BINANCE,
    symbol: 'BNBUSDT' as SymbolName,
    timeframe: timeframeEnum['15m'],
    openTimestamp: 1696312800000,
    open: 214.89,
    high: 215.3,
    low: 214.79,
    close: 215.1,
    volume: 175.3,
    closeTimestamp: 1696316399999,
    quoteAssetVolume: 37692.8842,
    numTrades: 53,
    takerBuyBaseAssetVolume: 147.21,
    takerBuyQuoteAssetVolume: 31654.7828,
  };

  describe('[GIVEN] input data is valid', () => {
    describe('[WHEN] create a kline', () => {
      it('[THEN] it will return Right of kline', () => {
        const result = createKline(validData);

        expect(result).toEqualRight({
          ...validData,
          openTimestamp: new Date(validData.openTimestamp),
          closeTimestamp: new Date(validData.closeTimestamp),
        });
      });
    });
  });

  describe('[GIVEN] the open timestamp property of input data is invalid', () => {
    describe.each([
      { case: 'the property is a float number', value: 1.1 },
      { case: 'the property is NaN', value: NaN },
    ])('[WHEN] create a kline with $case', ({ value }) => {
      it('[THEN] it will return Left of error', () => {
        const data = { ...validData, openTimestamp: value };

        const result = createKline(data);

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });

  describe('[GIVEN] the close timestamp property of input data is invalid', () => {
    describe.each([
      { case: 'the property is a float number', value: 1.1 },
      { case: 'the property is NaN', value: NaN },
      { case: 'the property is a date before open timestamp', value: validData.open - 1 },
    ])('[WHEN] create a kline with $case', ({ value }) => {
      it('[THEN] it will return Left of error', () => {
        const data = { ...validData, closeTimestamp: value };

        const result = createKline(data);

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });

  describe('[GIVEN] the open price property of input data is invalid', () => {
    describe.each([
      { case: 'the property is a negative number', value: -1 },
      { case: 'the property is NaN', value: NaN },
    ])('[WHEN] create a kline with $case', ({ value }) => {
      it('[THEN] it will return Left of error', () => {
        const data = { ...validData, open: value };

        const result = createKline(data);

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });

  describe('[GIVEN] the close price property of input data is invalid', () => {
    describe.each([
      { case: 'the property is a negative number', value: -1 },
      { case: 'the property is NaN', value: NaN },
    ])('[WHEN] create a kline with $case', ({ value }) => {
      it('[THEN] it will return Left of error', () => {
        const data = { ...validData, close: value };

        const result = createKline(data);

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });

  describe('[GIVEN] the high price property of input data is invalid', () => {
    describe.each([
      { case: 'the property is a negative number', value: -1 },
      { case: 'the property is NaN', value: NaN },
    ])('[WHEN] create a kline with $case', ({ value }) => {
      it('[THEN] it will return Left of error', () => {
        const data = { ...validData, high: value };

        const result = createKline(data);

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });

  describe('[GIVEN] the low price property of input data is invalid', () => {
    describe.each([
      { case: 'the property is a negative number', value: -1 },
      { case: 'the property is NaN', value: NaN },
    ])('[WHEN] create a kline with $case', ({ value }) => {
      it('[THEN] it will return Left of error', () => {
        const data = { ...validData, low: value };

        const result = createKline(data);

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });

  describe('[GIVEN] the volume property of input data is invalid', () => {
    describe.each([
      { case: 'the property is a negative number', value: -1 },
      { case: 'the property is NaN', value: NaN },
    ])('[WHEN] create a kline with $case', ({ value }) => {
      it('[THEN] it will return Left of error', () => {
        const data = { ...validData, volume: value };

        const result = createKline(data);

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });

  describe('[GIVEN] the quote asset volume property of input data is invalid', () => {
    describe.each([
      { case: 'the property is a negative number', value: -1 },
      { case: 'the property is NaN', value: NaN },
    ])('[WHEN] create a kline with $case', ({ value }) => {
      it('[THEN] it will return Left of error', () => {
        const data = { ...validData, quoteAssetVolume: value };

        const result = createKline(data);

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });

  describe('[GIVEN] the taker buy base asset volume property of input data is invalid', () => {
    describe.each([
      { case: 'the property is a negative number', value: -1 },
      { case: 'the property is NaN', value: NaN },
    ])('[WHEN] create a kline with $case', ({ value }) => {
      it('[THEN] it will return Left of error', () => {
        const data = { ...validData, takerBuyBaseAssetVolume: value };

        const result = createKline(data);

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });

  describe('[GIVEN] the taker buy quote asset volume property of input data is invalid', () => {
    describe.each([
      { case: 'the property is a negative number', value: -1 },
      { case: 'the property is NaN', value: NaN },
    ])('[WHEN] create a kline with $case', ({ value }) => {
      it('[THEN] it will return Left of error', () => {
        const data = { ...validData, takerBuyQuoteAssetVolume: value };

        const result = createKline(data);

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });

  describe('[GIVEN] the number of trades property of input data is invalid', () => {
    describe.each([
      { case: 'the property is a negative number', value: -1 },
      { case: 'the property is a float number', value: 1.1 },
      { case: 'the property is NaN', value: NaN },
    ])('[WHEN] create a kline with $case', ({ value }) => {
      it('[THEN] it will return Left of error', () => {
        const data = { ...validData, numTrades: value };

        const result = createKline(data);

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });
});
