import { faker } from '@faker-js/faker';

import { isBnbServiceError } from '#infra/services/binance/error.js';
import { randomAnyDate, randomBeforeAndAfterDate } from '#test-utils/faker.js';

import { DateRange, getListOfDays, getListOfMonths, validateTimestamp } from './binance.js';

// function mockDeps(overrides?: DeepPartial<GetKlinesHistoryDeps>): GetKlinesHistoryDeps {
//   return mergeDeepRight(
//     {
//       httpClient: { sendRequest: () => te.right({}) },
//       dateService: { getCurrentDate: () => randomAnyDate() },
//     },
//     overrides ?? {},
//   ) as GetKlinesHistoryDeps;
// }
// function mockRequest() {
//   const { before, after } = randomBeforeAndAfterDateInPast();
//   return {
//     symbol: randomString() as SymbolName,
//     timeframe: randomTimeframe(),
//     startTimestamp: before,
//     endTimestamp: after,
//   };
// }

describe('Validate Timestamp', () => {
  describe('WHEN start timestamp equals to end timestamp', () => {
    it('THEN it should return Left of error', () => {
      const currentDate = randomAnyDate();
      const startAndEnd = faker.date.recent({ refDate: currentDate });
      const result = validateTimestamp(currentDate, startAndEnd, startAndEnd);

      expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
    });
  });
  describe('WHEN start timestamp is after end timestamp', () => {
    it('THEN it should return Left of error', () => {
      const currentDate = randomAnyDate();
      const after = faker.date.recent({ refDate: currentDate });
      const before = faker.date.recent({ refDate: after });
      const result = validateTimestamp(currentDate, after, before);

      expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
    });
  });
  describe('WHEN start timestamp is in the future', () => {
    it('THEN it should return Left of error', () => {
      const currentDate = randomAnyDate();
      const { before, after } = randomBeforeAndAfterDate(currentDate);
      const result = validateTimestamp(currentDate, before, after);

      expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
    });
  });
  describe('WHEN end timestamp is in the future', () => {
    it('THEN it should return Left of error', () => {
      const currentDate = randomAnyDate();
      const before = faker.date.recent({ refDate: currentDate });
      const after = faker.date.future({ refDate: currentDate });
      const result = validateTimestamp(currentDate, before, after);

      expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
    });
  });
  describe('WHEN start and end timestamps is valid', () => {
    it('THEN it should return Right of start and end timestamps', () => {
      const currentDate = randomAnyDate();
      const after = faker.date.recent({ refDate: currentDate });
      const before = faker.date.recent({ refDate: after });
      const result = validateTimestamp(currentDate, before, after);

      expect(result).toEqualRight({ start: before, end: after });
    });
  });
});

describe('Get list of months', () => {
  describe('WHEN get list of months', () => {
    it('THEN it should a list of month swith year and month fields', () => {
      const range = {
        start: new Date('2023-01-05T06:00:00Z'),
        end: new Date('2023-04-10T06:00:00Z'),
      } as DateRange;

      const result = getListOfMonths(range);

      expect(result).toEqual([
        { year: '2023', month: '01' },
        { year: '2023', month: '02' },
        { year: '2023', month: '03' },
        { year: '2023', month: '04' },
      ]);
    });
  });
});

describe('Get list of days', () => {
  describe('WHEN get list of months', () => {
    it('THEN it should a list of days with year, month, and day field', () => {
      const range = {
        start: new Date('2023-04-06T06:00:00Z'),
        end: new Date('2023-04-10T06:00:00Z'),
      } as DateRange;

      const result = getListOfDays(range);

      expect(result).toEqual([
        { year: '2023', month: '04', day: '06' },
        { year: '2023', month: '04', day: '07' },
        { year: '2023', month: '04', day: '08' },
        { year: '2023', month: '04', day: '09' },
        { year: '2023', month: '04', day: '10' },
      ]);
    });
  });
});
