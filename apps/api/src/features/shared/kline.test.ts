import { ValidDate } from '#SECT/date.js';
import { isGeneralError } from '#shared/errors/generalError.js';

import { exchangeNameEnum } from './exchange.js';
import {
  calculateNumOfKlinesInDateRange,
  convertDateToEndOfTimeframe,
  convertDateToStartOfTimeframe,
  createKline,
} from './kline.js';
import { DateRange } from './objectValues/dateRange.js';
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

describe('UUT: Convert date to the start of timeframe', () => {
  describe.each([
    { timeframe: timeframeEnum['1s'], input: new Date('2011-01-03T00:00:01.000Z') },
    { timeframe: timeframeEnum['1m'], input: new Date('2011-01-03T00:02:00.000Z') },
    { timeframe: timeframeEnum['3m'], input: new Date('2011-01-03T00:03:00.000Z') },
    { timeframe: timeframeEnum['5m'], input: new Date('2011-01-03T00:10:00.000Z') },
    { timeframe: timeframeEnum['15m'], input: new Date('2011-01-03T00:30:00.000Z') },
    { timeframe: timeframeEnum['30m'], input: new Date('2011-01-03T01:30:00.000Z') },
    { timeframe: timeframeEnum['1h'], input: new Date('2011-01-03T02:00:00.000Z') },
    { timeframe: timeframeEnum['2h'], input: new Date('2011-01-03T04:00:00.000Z') },
    { timeframe: timeframeEnum['4h'], input: new Date('2011-01-03T08:00:00.000Z') },
    { timeframe: timeframeEnum['6h'], input: new Date('2011-01-03T12:00:00.000Z') },
    { timeframe: timeframeEnum['8h'], input: new Date('2011-01-03T16:00:00.000Z') },
    { timeframe: timeframeEnum['12h'], input: new Date('2011-01-03T00:00:00.000Z') },
    { timeframe: timeframeEnum['1d'], input: new Date('2011-01-03T00:00:00.000Z') },
    { timeframe: timeframeEnum['3d'], input: new Date('2022-07-25T00:00:00.000Z') },
    { timeframe: timeframeEnum['1w'], input: new Date('2020-12-28T00:00:00.000Z') },
    { timeframe: timeframeEnum['1M'], input: new Date('2011-02-01T00:00:00.000Z') },
  ])(
    '[GIVEN] timeframe is $timeframe [AND] the date is already equal to the start of timeframe',
    ({ timeframe, input }) => {
      describe('[WHEN] convert date to start of timeframe', () => {
        it('[THEN] it will return unchanged date', () => {
          const result = convertDateToStartOfTimeframe(input as ValidDate, timeframe);

          expect(result).toEqual(input);
        });
      });
    },
  );

  describe.each([
    {
      timeframe: timeframeEnum['1s'],
      input: new Date('2011-01-03T00:00:01.123Z'),
      expected: new Date('2011-01-03T00:00:01.000Z'),
    },
    {
      timeframe: timeframeEnum['1m'],
      input: new Date('2011-01-03T00:02:43.342Z'),
      expected: new Date('2011-01-03T00:02:00.000Z'),
    },
    {
      timeframe: timeframeEnum['3m'],
      input: new Date('2011-01-03T00:04:34.000Z'),
      expected: new Date('2011-01-03T00:03:00.000Z'),
    },
    {
      timeframe: timeframeEnum['5m'],
      input: new Date('2011-01-03T00:14:45.000Z'),
      expected: new Date('2011-01-03T00:10:00.000Z'),
    },
    {
      timeframe: timeframeEnum['15m'],
      input: new Date('2011-01-03T00:40:45.000Z'),
      expected: new Date('2011-01-03T00:30:00.000Z'),
    },
    {
      timeframe: timeframeEnum['30m'],
      input: new Date('2011-01-03T01:54:23.000Z'),
      expected: new Date('2011-01-03T01:30:00.000Z'),
    },
    {
      timeframe: timeframeEnum['1h'],
      input: new Date('2011-01-03T02:32:56.000Z'),
      expected: new Date('2011-01-03T02:00:00.000Z'),
    },
    {
      timeframe: timeframeEnum['2h'],
      input: new Date('2011-01-03T05:34:00.000Z'),
      expected: new Date('2011-01-03T04:00:00.000Z'),
    },
    {
      timeframe: timeframeEnum['4h'],
      input: new Date('2011-01-03T10:04:00.000Z'),
      expected: new Date('2011-01-03T08:00:00.000Z'),
    },
    {
      timeframe: timeframeEnum['6h'],
      input: new Date('2011-01-03T15:23:00.000Z'),
      expected: new Date('2011-01-03T12:00:00.000Z'),
    },
    {
      timeframe: timeframeEnum['8h'],
      input: new Date('2011-01-03T16:45:00.000Z'),
      expected: new Date('2011-01-03T16:00:00.000Z'),
    },
    {
      timeframe: timeframeEnum['12h'],
      input: new Date('2011-01-03T11:00:00.000Z'),
      expected: new Date('2011-01-03T00:00:00.000Z'),
    },
    {
      timeframe: timeframeEnum['1d'],
      input: new Date('2011-01-03T12:34:35.000Z'),
      expected: new Date('2011-01-03T00:00:00.000Z'),
    },
    {
      timeframe: timeframeEnum['3d'],
      input: new Date('2023-05-07T14:34:00.000Z'),
      expected: new Date('2023-05-06T00:00:00.000Z'),
    },
    {
      timeframe: timeframeEnum['1w'],
      input: new Date('2011-01-05T00:34:00.000Z'),
      expected: new Date('2011-01-03T00:00:00.000Z'),
    },
    {
      timeframe: timeframeEnum['1M'],
      input: new Date('2011-02-06T00:00:00.000Z'),
      expected: new Date('2011-02-01T00:00:00.000Z'),
    },
  ])(
    '[GIVEN] timeframe is $timeframe [AND] the date is not equal to the start of timeframe',
    ({ timeframe, input, expected }) => {
      describe('[WHEN] convert date to start of timeframe', () => {
        it('[THEN] it will return the start of timeframe', () => {
          const result = convertDateToStartOfTimeframe(input as ValidDate, timeframe);

          expect(result).toEqual(expected);
        });
      });
    },
  );
});

describe('UUT: Convert date to the end of kline', () => {
  describe.each([
    { timeframe: timeframeEnum['1s'], input: new Date('2011-01-03T00:00:01.999Z') },
    { timeframe: timeframeEnum['1m'], input: new Date('2011-01-03T00:02:59.999Z') },
    { timeframe: timeframeEnum['3m'], input: new Date('2011-01-03T00:05:59.999Z') },
    { timeframe: timeframeEnum['5m'], input: new Date('2011-01-03T00:09:59.999Z') },
    { timeframe: timeframeEnum['15m'], input: new Date('2011-01-03T00:29:59.999Z') },
    { timeframe: timeframeEnum['30m'], input: new Date('2011-01-03T01:59:59.999Z') },
    { timeframe: timeframeEnum['1h'], input: new Date('2011-01-03T04:59:59.999Z') },
    { timeframe: timeframeEnum['2h'], input: new Date('2011-01-03T03:59:59.999Z') },
    { timeframe: timeframeEnum['4h'], input: new Date('2011-01-03T07:59:59.999Z') },
    { timeframe: timeframeEnum['6h'], input: new Date('2011-01-03T11:59:59.999Z') },
    { timeframe: timeframeEnum['8h'], input: new Date('2011-01-03T15:59:59.999Z') },
    { timeframe: timeframeEnum['12h'], input: new Date('2011-01-03T23:59:59.999Z') },
    { timeframe: timeframeEnum['1d'], input: new Date('2011-01-03T23:59:59.999Z') },
    { timeframe: timeframeEnum['3d'], input: new Date('2022-07-24T23:59:59.999Z') },
    { timeframe: timeframeEnum['1w'], input: new Date('2020-12-27T23:59:59.999Z') },
    { timeframe: timeframeEnum['1M'], input: new Date('2011-01-31T23:59:59.999Z') },
  ])(
    '[GIVEN] timeframe is $timeframe [AND] the date is already equal to the end of kline',
    ({ timeframe, input }) => {
      describe('[WHEN] convert date to end of kline', () => {
        it('[THEN] it will return unchanged date', () => {
          const result = convertDateToEndOfTimeframe(input as ValidDate, timeframe);

          expect(result).toEqual(input);
        });
      });
    },
  );

  describe.each([
    {
      timeframe: timeframeEnum['1s'],
      input: new Date('2011-01-03T00:00:01.239Z'),
      expected: new Date('2011-01-03T00:00:01.999Z'),
    },
    {
      timeframe: timeframeEnum['1m'],
      input: new Date('2011-01-03T00:02:23.549Z'),
      expected: new Date('2011-01-03T00:02:59.999Z'),
    },
    {
      timeframe: timeframeEnum['3m'],
      input: new Date('2011-01-03T00:01:39.999Z'),
      expected: new Date('2011-01-03T00:02:59.999Z'),
    },
    {
      timeframe: timeframeEnum['5m'],
      input: new Date('2011-01-03T00:05:41.999Z'),
      expected: new Date('2011-01-03T00:09:59.999Z'),
    },
    {
      timeframe: timeframeEnum['15m'],
      input: new Date('2011-01-03T00:28:31.999Z'),
      expected: new Date('2011-01-03T00:29:59.999Z'),
    },
    {
      timeframe: timeframeEnum['30m'],
      input: new Date('2011-01-03T01:35:59.999Z'),
      expected: new Date('2011-01-03T01:59:59.999Z'),
    },
    {
      timeframe: timeframeEnum['1h'],
      input: new Date('2011-01-03T04:42:59.999Z'),
      expected: new Date('2011-01-03T04:59:59.999Z'),
    },
    {
      timeframe: timeframeEnum['2h'],
      input: new Date('2011-01-03T02:42:59.999Z'),
      expected: new Date('2011-01-03T03:59:59.999Z'),
    },
    {
      timeframe: timeframeEnum['4h'],
      input: new Date('2011-01-03T07:32:59.999Z'),
      expected: new Date('2011-01-03T07:59:59.999Z'),
    },
    {
      timeframe: timeframeEnum['6h'],
      input: new Date('2011-01-03T11:23:34.999Z'),
      expected: new Date('2011-01-03T11:59:59.999Z'),
    },
    {
      timeframe: timeframeEnum['8h'],
      input: new Date('2011-01-03T12:43:59.999Z'),
      expected: new Date('2011-01-03T15:59:59.999Z'),
    },
    {
      timeframe: timeframeEnum['12h'],
      input: new Date('2011-01-03T23:23:59.432Z'),
      expected: new Date('2011-01-03T23:59:59.999Z'),
    },
    {
      timeframe: timeframeEnum['1d'],
      input: new Date('2011-01-03T23:23:53.999Z'),
      expected: new Date('2011-01-03T23:59:59.999Z'),
    },
    {
      timeframe: timeframeEnum['3d'],
      input: new Date('2022-07-22T23:59:59.999Z'),
      expected: new Date('2022-07-24T23:59:59.999Z'),
    },
    {
      timeframe: timeframeEnum['1w'],
      input: new Date('2020-12-24T23:59:59.999Z'),
      expected: new Date('2020-12-27T23:59:59.999Z'),
    },
    {
      timeframe: timeframeEnum['1M'],
      input: new Date('2011-01-05T12:59:59.999Z'),
      expected: new Date('2011-01-31T23:59:59.999Z'),
    },
  ])(
    '[GIVEN] timeframe is $timeframe [AND] the date is not equal to the end of kline',
    ({ timeframe, input, expected }) => {
      describe('[WHEN] convert date to end of kline', () => {
        it('[THEN] it will return the end of kline', () => {
          const result = convertDateToEndOfTimeframe(input as ValidDate, timeframe);

          expect(result).toEqual(expected);
        });
      });
    },
  );
});

describe('UUT: Calculate number of klines in date range', () => {
  describe('[GIVEN] start and end are equal [AND] they do not cover any end of kline', () => {
    describe('[WHEN] calculate number of klines in date range', () => {
      it('[THEN] it will return 0', () => {
        const dateRange = { start: new Date('2021-05-14'), end: new Date('2021-05-14') } as DateRange;
        const timeframe = timeframeEnum['1d'];

        const result = calculateNumOfKlinesInDateRange(dateRange, timeframe);

        expect(result).toBe(0);
      });
    });
  });

  describe('[GIVEN] start and end are equal [AND] they also equal to end of kline', () => {
    describe('[WHEN] calculate number of klines in date range', () => {
      it('[THEN] it will return 1', () => {
        const dateRange = {
          start: new Date('2021-05-14T23:59:59.999Z'),
          end: new Date('2021-05-14T23:59:59.999Z'),
        } as DateRange;
        const timeframe = timeframeEnum['1d'];

        const result = calculateNumOfKlinesInDateRange(dateRange, timeframe);

        expect(result).toBe(1);
      });
    });
  });

  describe('[GIVEN] start and end are in the same kline [AND] the end equal to end of kline', () => {
    describe('[WHEN] calculate number of klines in date range', () => {
      it('[THEN] it will return 1', () => {
        const dateRange = {
          start: new Date('2021-05-14T14:23:59.999Z'),
          end: new Date('2021-05-14T23:59:59.999Z'),
        } as DateRange;
        const timeframe = timeframeEnum['1d'];

        const result = calculateNumOfKlinesInDateRange(dateRange, timeframe);

        expect(result).toBe(1);
      });
    });
  });

  describe('[GIVEN] start and end are cover only 1 end of kline', () => {
    describe('[WHEN] calculate number of klines in date range', () => {
      it('[THEN] it will return 1', () => {
        const dateRange = {
          start: new Date('2021-05-14T14:23:59.999Z'),
          end: new Date('2021-05-15T10:59:59.999Z'),
        } as DateRange;
        const timeframe = timeframeEnum['1d'];

        const result = calculateNumOfKlinesInDateRange(dateRange, timeframe);

        expect(result).toBe(1);
      });
    });
  });

  describe('[GIVEN] start and end are cover 2 end of kline', () => {
    describe('[WHEN] calculate number of klines in date range', () => {
      it('[THEN] it will return 2', () => {
        const dateRange = {
          start: new Date('2021-05-14T14:23:59.999Z'),
          end: new Date('2021-05-14T16:50:59.999Z'),
        } as DateRange;
        const timeframe = timeframeEnum['1h'];

        const result = calculateNumOfKlinesInDateRange(dateRange, timeframe);

        expect(result).toBe(2);
      });
    });
  });

  describe('[GIVEN] timeframe is 1w [AND] start and end are cover 1 end of kline', () => {
    describe('[WHEN] calculate number of klines in date range', () => {
      it('[THEN] it will return 1', () => {
        const dateRange = {
          start: new Date('2021-05-09T14:23:59.999Z'),
          end: new Date('2021-05-14T16:50:59.999Z'),
        } as DateRange;
        const timeframe = timeframeEnum['1w'];

        const result = calculateNumOfKlinesInDateRange(dateRange, timeframe);

        expect(result).toBe(1);
      });
    });
  });

  describe('[GIVEN] timeframe is 1M [AND] start and end are cover 1 end of kline', () => {
    describe('[WHEN] calculate number of klines in date range', () => {
      it('[THEN] it will return 1', () => {
        const dateRange = {
          start: new Date('2021-04-09T14:23:59.999Z'),
          end: new Date('2021-05-01T16:50:59.999Z'),
        } as DateRange;
        const timeframe = timeframeEnum['1M'];

        const result = calculateNumOfKlinesInDateRange(dateRange, timeframe);

        expect(result).toBe(1);
      });
    });
  });
});
