import { exchangeNameEnum } from '#features/shared/exchange.js';
import { AssetCurrency, CapitalCurrency, languageEnum } from '#features/shared/strategy.js';
import { SymbolName } from '#features/shared/symbol.js';
import { timeframeEnum } from '#features/shared/timeframe.js';
import { isGeneralError } from '#shared/errors/generalError.js';
import { ValidDate } from '#shared/utils/date.js';
import { TimezoneString } from '#shared/utils/string.js';

import { BtStrategyId, createBtStrategyModel } from './btStrategy.js';

describe('UUT: Create backtesting strategy model', () => {
  const defaultCurrentDate = new Date('2022-10-10') as ValidDate;
  const validData = {
    id: 'aRexb1yIua' as BtStrategyId,
    name: 'name' as string,
    exchange: exchangeNameEnum.BINANCE,
    symbol: 'BTCUSDT' as SymbolName,
    timeframe: timeframeEnum['15m'],
    initialCapital: 1000,
    assetCurrency: 'BTC' as AssetCurrency,
    capitalCurrency: 'USDT' as CapitalCurrency,
    takerFeeRate: 1,
    makerFeeRate: 2,
    maxNumKlines: 10,
    startTimestamp: new Date('2022-01-01') as ValidDate,
    endTimestamp: new Date('2022-01-02') as ValidDate,
    timezone: '+06:00' as TimezoneString,
    language: languageEnum.javascript,
    body: 'console.log("Hello")',
  };

  describe('[GIVEN] input data is valid', () => {
    describe('[WHEN] create a backtesting strategy model', () => {
      it('[THEN] it will return Right of backtesting strategy model', () => {
        const currentDate = defaultCurrentDate;

        const result = createBtStrategyModel(validData, currentDate);

        expect(result).toEqualRight({
          ...validData,
          version: 0,
          createdAt: currentDate,
          updatedAt: currentDate,
        });
      });
    });
  });

  describe('[GIVEN] the name property of input data is invalid', () => {
    describe.each([
      { case: 'the property is an empty string', value: '' },
      { case: 'the property is a string with only whitespace', value: ' ' },
    ])('[WHEN] create a create backtesting strategy model with $case', ({ value }) => {
      it('[THEN] it will return Left of error', () => {
        const currentDate = defaultCurrentDate;
        const data = { ...validData, name: value };

        const result = createBtStrategyModel(data, currentDate);

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });

  describe('[GIVEN] the initial capital property of input data is invalid', () => {
    describe.each([
      { case: 'the property is a negative number', value: -1 },
      { case: 'the property is NaN', value: NaN },
    ])('[WHEN] create a create backtesting strategy model with $case', ({ value }) => {
      it('[THEN] it will return Left of error', () => {
        const currentDate = defaultCurrentDate;
        const data = { ...validData, initialCapital: value };

        const result = createBtStrategyModel(data, currentDate);

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });

  describe('[GIVEN] the taker fee rate property of input data is invalid', () => {
    describe.each([
      { case: 'the property is a negative number', value: -1 },
      { case: 'the property is NaN', value: NaN },
      { case: 'the property is more than 100', value: 100.1 },
    ])('[WHEN] create a create backtesting strategy model with $case', ({ value }) => {
      it('[THEN] it will return Left of error', () => {
        const currentDate = defaultCurrentDate;
        const data = { ...validData, takerFeeRate: value };

        const result = createBtStrategyModel(data, currentDate);

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });

  describe('[GIVEN] the maker fee rate property of input data is invalid', () => {
    describe.each([
      { case: 'the property is a negative number', value: -1 },
      { case: 'the property is NaN', value: NaN },
      { case: 'the property is more than 100', value: 100.1 },
    ])('[WHEN] create a create backtesting strategy model with $case', ({ value }) => {
      it('[THEN] it will return Left of error', () => {
        const currentDate = defaultCurrentDate;
        const data = { ...validData, makerFeeRate: value };

        const result = createBtStrategyModel(data, currentDate);

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });

  describe('[GIVEN] the maximum number of klines property of input data is invalid', () => {
    describe.each([
      { case: 'the property is a negative number', value: -1 },
      { case: 'the property is NaN', value: NaN },
      { case: 'the property is 0', value: 0 },
      { case: 'the property is a float number', value: 1.2 },
    ])('[WHEN] create a create backtesting strategy model with $case', ({ value }) => {
      it('[THEN] it will return Left of error', () => {
        const currentDate = defaultCurrentDate;
        const data = { ...validData, maxNumKlines: value };

        const result = createBtStrategyModel(data, currentDate);

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });

  describe('[GIVEN] the start timestamp property of input data is invalid', () => {
    const currentDate = new Date('2021-12-01') as ValidDate;

    describe.each([{ case: 'the property is a date before current date', value: new Date('2022-01-01') }])(
      '[WHEN] create a create backtesting strategy model with $case',
      ({ value }) => {
        it('[THEN] it will return Left of error', () => {
          const data = { ...validData, startTimestamp: value as ValidDate };

          const result = createBtStrategyModel(data, currentDate);

          expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
        });
      },
    );
  });

  describe('[GIVEN] the end timestamp property of input data is invalid', () => {
    const currentDate = new Date('2021-12-01') as ValidDate;

    describe.each([
      { case: 'the property is a date before current date', value: new Date('2022-01-02') },
      { case: 'the property is a date that equals to start timestamp', value: new Date('2021-01-01') },
      { case: 'the property is a date before start timestamp', value: new Date('2021-12-20') },
    ])('[WHEN] create a create backtesting strategy model with $case', ({ value }) => {
      it('[THEN] it will return Left of error', () => {
        const data = {
          ...validData,
          startTimestamp: new Date('2021-01-01') as ValidDate,
          endTimestamp: value as ValidDate,
        };

        const result = createBtStrategyModel(data, currentDate);

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });

  describe('[GIVEN] the body property of input data is invalid', () => {
    describe.each([
      { case: 'the property is an empty string', value: '' },
      { case: 'the property is a string with only whitespace', value: ' ' },
    ])('[WHEN] create a create backtesting strategy model with $case', ({ value }) => {
      it('[THEN] it will return Left of error', () => {
        const currentDate = defaultCurrentDate;
        const data = { ...validData, body: value };

        const result = createBtStrategyModel(data, currentDate);

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });
});
